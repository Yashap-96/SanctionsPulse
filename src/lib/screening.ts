import type { SanctionEntry } from "./types";

// ── Screening types ──────────────────────────────────────────────

export interface ScreeningQuery {
  name?: string;
  address?: string;
  country?: string; // ISO2
  idNumber?: string;
  cryptoAddress?: string;
  vesselName?: string;
}

export interface FieldMatch {
  field: "name" | "alias" | "address" | "country" | "id" | "crypto" | "vessel";
  matched: string;
  query: string;
  score: number;
  method: "exact" | "normalized" | "fuzzy" | "phonetic" | "token" | "contains";
}

export interface ScreeningMatch {
  entry: SanctionEntry;
  score: number; // 0–100
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  fieldMatches: FieldMatch[];
}

export interface ScreeningResult {
  query: ScreeningQuery;
  matches: ScreeningMatch[];
  totalScreened: number;
  duration: number; // ms
}

// ── String normalization ─────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ") // non-alphanumeric → space
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

// ── Soundex (phonetic hashing) ───────────────────────────────────

function soundex(s: string): string {
  const word = normalize(s).replace(/[^a-z]/g, "");
  if (!word) return "0000";

  const codes: Record<string, string> = {
    b: "1", f: "1", p: "1", v: "1",
    c: "2", g: "2", j: "2", k: "2", q: "2", s: "2", x: "2", z: "2",
    d: "3", t: "3",
    l: "4",
    m: "5", n: "5",
    r: "6",
  };

  let result = word[0].toUpperCase();
  let lastCode = codes[word[0]] ?? "";

  for (let i = 1; i < word.length && result.length < 4; i++) {
    const code = codes[word[i]] ?? "";
    if (code && code !== lastCode) {
      result += code;
    }
    lastCode = code || lastCode;
  }

  return (result + "0000").slice(0, 4);
}

// ── Levenshtein distance ─────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Optimization: skip if lengths differ too much
  if (Math.abs(a.length - b.length) > Math.max(a.length, b.length) * 0.5) {
    return Math.max(a.length, b.length);
  }

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function levenshteinScore(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(a, b);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

// ── Token-based matching ─────────────────────────────────────────
// Compares sets of name tokens — handles word reordering

function tokenMatchScore(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;

  let matchedCount = 0;
  let totalScore = 0;
  const used = new Set<number>();

  for (const qt of queryTokens) {
    let bestScore = 0;
    let bestIdx = -1;
    for (let i = 0; i < targetTokens.length; i++) {
      if (used.has(i)) continue;
      const s = levenshteinScore(qt, targetTokens[i]);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    if (bestScore >= 70 && bestIdx >= 0) {
      used.add(bestIdx);
      totalScore += bestScore;
      matchedCount++;
    }
  }

  if (matchedCount === 0) return 0;

  // Score based on: how many query tokens matched, and how well
  const coverage = matchedCount / queryTokens.length;
  const avgScore = totalScore / matchedCount;
  // Penalty if target has many more tokens than matched
  const targetCoverage = matchedCount / targetTokens.length;

  return Math.round(avgScore * coverage * 0.7 + avgScore * targetCoverage * 0.3);
}

// ── Name matching (combines multiple methods) ────────────────────

function matchName(
  query: string,
  targetName: string,
  targetAliases: string[]
): FieldMatch | null {
  const qNorm = normalize(query);
  if (!qNorm) return null;

  const qTokens = tokenize(query);
  const qSoundex = qTokens.map(soundex);

  // Check primary name
  const nameMatch = matchSingleName(qNorm, qTokens, qSoundex, targetName, "name");

  // Check aliases
  let bestAliasMatch: FieldMatch | null = null;
  for (const alias of targetAliases) {
    const m = matchSingleName(qNorm, qTokens, qSoundex, alias, "alias");
    if (m && (!bestAliasMatch || m.score > bestAliasMatch.score)) {
      bestAliasMatch = m;
    }
  }

  // Return whichever is better
  if (!nameMatch && !bestAliasMatch) return null;
  if (!nameMatch) return bestAliasMatch;
  if (!bestAliasMatch) return nameMatch;
  return nameMatch.score >= bestAliasMatch.score ? nameMatch : bestAliasMatch;
}

function matchSingleName(
  qNorm: string,
  qTokens: string[],
  qSoundex: string[],
  target: string,
  field: "name" | "alias"
): FieldMatch | null {
  const tNorm = normalize(target);
  if (!tNorm) return null;

  // 1. Exact normalized match
  if (qNorm === tNorm) {
    return { field, matched: target, query: qNorm, score: 100, method: "exact" };
  }

  // 2. Contains check (query is substring of target or vice versa)
  if (tNorm.includes(qNorm) || qNorm.includes(tNorm)) {
    const shorter = Math.min(qNorm.length, tNorm.length);
    const longer = Math.max(qNorm.length, tNorm.length);
    const containsScore = Math.round((shorter / longer) * 95);
    if (containsScore >= 50) {
      return { field, matched: target, query: qNorm, score: containsScore, method: "contains" };
    }
  }

  // 3. Token-based matching (handles word reordering)
  const tTokens = tokenize(target);
  const tokenScore = tokenMatchScore(qTokens, tTokens);

  // 4. Phonetic (Soundex) matching
  const tSoundex = tTokens.map(soundex);
  let soundexMatches = 0;
  const usedSdx = new Set<number>();
  for (const qs of qSoundex) {
    for (let i = 0; i < tSoundex.length; i++) {
      if (!usedSdx.has(i) && qs === tSoundex[i]) {
        soundexMatches++;
        usedSdx.add(i);
        break;
      }
    }
  }
  const soundexScore =
    qSoundex.length > 0
      ? Math.round((soundexMatches / qSoundex.length) * 75)
      : 0;

  // 5. Direct Levenshtein on full string
  const levScore = levenshteinScore(qNorm, tNorm);

  // Take the best score
  const bestScore = Math.max(tokenScore, soundexScore, levScore);
  if (bestScore < 50) return null;

  const method: FieldMatch["method"] =
    bestScore === tokenScore
      ? "token"
      : bestScore === soundexScore
        ? "phonetic"
        : "fuzzy";

  return { field, matched: target, query: qNorm, score: bestScore, method };
}

// ── Address matching ─────────────────────────────────────────────

function matchAddress(
  queryAddress: string,
  queryCountry: string | undefined,
  entry: SanctionEntry
): FieldMatch | null {
  if (entry.addresses.length === 0 && entry.countries.length === 0) return null;

  let bestScore = 0;
  let bestMatched = "";

  // Check country match first
  if (queryCountry) {
    const countryUpper = queryCountry.toUpperCase();
    const countryMatch =
      entry.countries.includes(countryUpper) ||
      entry.addresses.some((a) => a.country?.toUpperCase() === countryUpper) ||
      entry.nationalities.some((n) => n.toUpperCase() === countryUpper);

    if (countryMatch) {
      bestScore = 60; // Country-only match
      bestMatched = countryUpper;
    }
  }

  // Check address text
  if (queryAddress) {
    const qNorm = normalize(queryAddress);
    for (const addr of entry.addresses) {
      const parts = [addr.city, addr.state, addr.postal_code, addr.country]
        .filter(Boolean)
        .join(" ");
      const aNorm = normalize(parts);
      if (!aNorm) continue;

      // Check if query is contained in address
      if (aNorm.includes(qNorm) || qNorm.includes(aNorm)) {
        const shorter = Math.min(qNorm.length, aNorm.length);
        const longer = Math.max(qNorm.length, aNorm.length);
        const s = Math.round((shorter / longer) * 90);
        if (s > bestScore) {
          bestScore = s;
          bestMatched = parts;
        }
      }

      // Token matching for address components
      const qTokens = tokenize(queryAddress);
      const aTokens = tokenize(parts);
      const ts = tokenMatchScore(qTokens, aTokens);
      if (ts > bestScore) {
        bestScore = ts;
        bestMatched = parts;
      }
    }
  }

  if (bestScore < 40) return null;

  return {
    field: queryAddress ? "address" : "country",
    matched: bestMatched,
    query: queryAddress || queryCountry || "",
    score: bestScore,
    method: bestScore === 60 && !queryAddress ? "exact" : "fuzzy",
  };
}

// ── ID number matching ───────────────────────────────────────────

function matchId(queryId: string, entry: SanctionEntry): FieldMatch | null {
  if (entry.ids.length === 0) return null;

  const qNorm = queryId.replace(/[\s\-_.]/g, "").toUpperCase();
  if (!qNorm) return null;

  for (const doc of entry.ids) {
    const dNorm = doc.number.replace(/[\s\-_.]/g, "").toUpperCase();

    // Exact match
    if (qNorm === dNorm) {
      return {
        field: "id",
        matched: `${doc.type}: ${doc.number}`,
        query: queryId,
        score: 100,
        method: "exact",
      };
    }

    // Partial match (one contains the other)
    if (dNorm.includes(qNorm) || qNorm.includes(dNorm)) {
      const shorter = Math.min(qNorm.length, dNorm.length);
      const longer = Math.max(qNorm.length, dNorm.length);
      const score = Math.round((shorter / longer) * 90);
      if (score >= 70) {
        return {
          field: "id",
          matched: `${doc.type}: ${doc.number}`,
          query: queryId,
          score,
          method: "contains",
        };
      }
    }
  }

  return null;
}

// ── Crypto wallet matching ───────────────────────────────────────

function matchCrypto(queryAddr: string, entry: SanctionEntry): FieldMatch | null {
  if (entry.crypto_wallets.length === 0) return null;

  const qNorm = queryAddr.trim();
  if (!qNorm) return null;

  for (const wallet of entry.crypto_wallets) {
    // Crypto addresses are case-sensitive for some chains, case-insensitive for others
    if (wallet.address === qNorm || wallet.address.toLowerCase() === qNorm.toLowerCase()) {
      return {
        field: "crypto",
        matched: `${wallet.currency}: ${wallet.address}`,
        query: queryAddr,
        score: 100,
        method: "exact",
      };
    }

    // Partial match (prefix/suffix)
    const wLower = wallet.address.toLowerCase();
    const qLower = qNorm.toLowerCase();
    if (wLower.includes(qLower) || qLower.includes(wLower)) {
      const shorter = Math.min(qLower.length, wLower.length);
      const longer = Math.max(qLower.length, wLower.length);
      const score = Math.round((shorter / longer) * 95);
      if (score >= 60) {
        return {
          field: "crypto",
          matched: `${wallet.currency}: ${wallet.address}`,
          query: queryAddr,
          score,
          method: "contains",
        };
      }
    }
  }

  return null;
}

// ── Vessel/Aircraft name matching ────────────────────────────────

function matchVessel(queryVessel: string, entry: SanctionEntry): FieldMatch | null {
  if (entry.entry_type !== "Vessel" && entry.entry_type !== "Aircraft") return null;

  const nameMatch = matchSingleName(
    normalize(queryVessel),
    tokenize(queryVessel),
    tokenize(queryVessel).map(soundex),
    entry.name,
    "name"
  );

  if (nameMatch && nameMatch.score >= 50) {
    return {
      field: "vessel",
      matched: entry.name,
      query: queryVessel,
      score: nameMatch.score,
      method: nameMatch.method,
    };
  }

  // Also check aliases for vessel
  for (const alias of entry.aliases) {
    const m = matchSingleName(
      normalize(queryVessel),
      tokenize(queryVessel),
      tokenize(queryVessel).map(soundex),
      alias,
      "name"
    );
    if (m && m.score >= 50) {
      return {
        field: "vessel",
        matched: alias,
        query: queryVessel,
        score: m.score,
        method: m.method,
      };
    }
  }

  return null;
}

// ── Composite scoring ────────────────────────────────────────────

function computeCompositeScore(matches: FieldMatch[]): number {
  if (matches.length === 0) return 0;

  // Weight by field importance
  const weights: Record<FieldMatch["field"], number> = {
    name: 1.0,
    alias: 0.9,
    id: 1.0,
    crypto: 1.0,
    vessel: 1.0,
    address: 0.6,
    country: 0.4,
  };

  // Take the best match score, then boost for multiple field matches
  const sorted = [...matches].sort((a, b) => b.score * weights[b.field] - a.score * weights[a.field]);
  const primary = sorted[0].score * weights[sorted[0].field];

  // Each additional matching field adds a small boost (up to +15)
  const boost = Math.min(15, (sorted.length - 1) * 5);

  return Math.min(100, Math.round(primary + boost));
}

function riskLevel(score: number): ScreeningMatch["riskLevel"] {
  if (score >= 95) return "CRITICAL";
  if (score >= 80) return "HIGH";
  if (score >= 60) return "MEDIUM";
  return "LOW";
}

// ── Main screening function ──────────────────────────────────────

export function screenEntries(
  query: ScreeningQuery,
  entries: SanctionEntry[],
  threshold: number = 50,
  maxResults: number = 100
): ScreeningResult {
  const start = performance.now();

  // Validate at least one field
  const hasQuery = Object.values(query).some((v) => v && v.trim());
  if (!hasQuery) {
    return {
      query,
      matches: [],
      totalScreened: entries.length,
      duration: performance.now() - start,
    };
  }

  const results: ScreeningMatch[] = [];

  for (const entry of entries) {
    const fieldMatches: FieldMatch[] = [];

    // Name screening (includes aliases)
    if (query.name) {
      const m = matchName(query.name, entry.name, entry.aliases);
      if (m) fieldMatches.push(m);
    }

    // Address screening
    if (query.address || query.country) {
      const m = matchAddress(query.address || "", query.country, entry);
      if (m) fieldMatches.push(m);
    }

    // ID screening
    if (query.idNumber) {
      const m = matchId(query.idNumber, entry);
      if (m) fieldMatches.push(m);
    }

    // Crypto screening
    if (query.cryptoAddress) {
      const m = matchCrypto(query.cryptoAddress, entry);
      if (m) fieldMatches.push(m);
    }

    // Vessel/Aircraft screening
    if (query.vesselName) {
      const m = matchVessel(query.vesselName, entry);
      if (m) fieldMatches.push(m);
    }

    if (fieldMatches.length > 0) {
      const score = computeCompositeScore(fieldMatches);
      if (score >= threshold) {
        results.push({
          entry,
          score,
          riskLevel: riskLevel(score),
          fieldMatches,
        });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return {
    query,
    matches: results.slice(0, maxResults),
    totalScreened: entries.length,
    duration: performance.now() - start,
  };
}

// ── Pre-built indexes for fast exact matching ────────────────────

export interface ScreeningIndex {
  entries: SanctionEntry[];
  idLookup: Map<string, number[]>; // normalized ID → entry indices
  cryptoLookup: Map<string, number[]>; // wallet address → entry indices
  countryLookup: Map<string, number[]>; // ISO2 → entry indices
  vesselIndices: number[]; // indices of Vessel/Aircraft entries
}

export function buildIndex(entries: SanctionEntry[]): ScreeningIndex {
  const idLookup = new Map<string, number[]>();
  const cryptoLookup = new Map<string, number[]>();
  const countryLookup = new Map<string, number[]>();
  const vesselIndices: number[] = [];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];

    // ID index
    for (const doc of e.ids) {
      const key = doc.number.replace(/[\s\-_.]/g, "").toUpperCase();
      if (key) {
        const arr = idLookup.get(key) ?? [];
        arr.push(i);
        idLookup.set(key, arr);
      }
    }

    // Crypto index
    for (const w of e.crypto_wallets) {
      const key = w.address.toLowerCase();
      const arr = cryptoLookup.get(key) ?? [];
      arr.push(i);
      cryptoLookup.set(key, arr);
    }

    // Country index
    for (const c of e.countries) {
      const key = c.toUpperCase();
      const arr = countryLookup.get(key) ?? [];
      arr.push(i);
      countryLookup.set(key, arr);
    }

    // Vessel index
    if (e.entry_type === "Vessel" || e.entry_type === "Aircraft") {
      vesselIndices.push(i);
    }
  }

  return { entries, idLookup, cryptoLookup, countryLookup, vesselIndices };
}

// ── Optimized screening using index (for exact-match fields) ─────

export function screenWithIndex(
  query: ScreeningQuery,
  index: ScreeningIndex,
  threshold: number = 50,
  maxResults: number = 100
): ScreeningResult {
  const start = performance.now();

  const hasQuery = Object.values(query).some((v) => v && v.trim());
  if (!hasQuery) {
    return {
      query,
      matches: [],
      totalScreened: index.entries.length,
      duration: performance.now() - start,
    };
  }

  // For exact-match fields, use index to narrow candidates
  let candidateIndices: Set<number> | null = null;

  // ID exact lookup
  if (query.idNumber) {
    const key = query.idNumber.replace(/[\s\-_.]/g, "").toUpperCase();
    const hits = index.idLookup.get(key);
    if (hits) {
      candidateIndices = new Set(hits);
    }
  }

  // Crypto exact lookup
  if (query.cryptoAddress) {
    const key = query.cryptoAddress.trim().toLowerCase();
    const hits = index.cryptoLookup.get(key);
    if (hits) {
      const hitSet = new Set(hits);
      candidateIndices = candidateIndices
        ? new Set([...candidateIndices, ...hitSet])
        : hitSet;
    }
  }

  // Country filter: narrow to entries in that country
  if (query.country && !query.name && !query.address && !query.vesselName) {
    const hits = index.countryLookup.get(query.country.toUpperCase());
    if (hits) {
      candidateIndices = candidateIndices
        ? new Set([...candidateIndices, ...hits])
        : new Set(hits);
    }
  }

  // Vessel: narrow to vessel/aircraft entries
  if (query.vesselName && !query.name) {
    const hitSet = new Set(index.vesselIndices);
    candidateIndices = candidateIndices
      ? new Set([...candidateIndices, ...hitSet])
      : hitSet;
  }

  // If we only have exact-match queries and got index hits, screen just those
  // If we have name/address (fuzzy), must screen all entries
  const needsFullScan = !!(query.name || query.address);
  const entriesToScreen = needsFullScan
    ? index.entries
    : candidateIndices
      ? Array.from(candidateIndices).map((i) => index.entries[i])
      : index.entries;

  return screenEntries(query, entriesToScreen, threshold, maxResults);
}
