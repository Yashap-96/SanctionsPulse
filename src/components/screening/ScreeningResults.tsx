import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Hash,
  Users,
  Fingerprint,
  Bitcoin,
  MapPin,
  Globe,
  Ship,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import type { ScreeningMatch, ScreeningResult, FieldMatch } from "../../lib/screening";
import { Badge } from "../common/Badge";
import { classNames } from "../../lib/utils";
import { countryName } from "../../lib/constants";

// ── Risk level badge ──────────────────────────────────────────────

function RiskBadge({ level }: { level: ScreeningMatch["riskLevel"] }) {
  const config = {
    CRITICAL: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert },
    HIGH: { color: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/20", icon: ShieldAlert },
    MEDIUM: { color: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/20", icon: Shield },
    LOW: { color: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/20", icon: ShieldCheck },
  };
  const { color, icon: Icon } = config[level];

  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
        color
      )}
    >
      <Icon className="h-3 w-3" />
      {level}
    </span>
  );
}

// ── Score bar ─────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 95 ? "bg-red-500" :
    score >= 80 ? "bg-[#ef4444]" :
    score >= 60 ? "bg-[#f59e0b]" :
    "bg-[#22c55e]";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={classNames("h-full rounded-full transition-all", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-[family-name:var(--font-mono)] text-white/70 w-8 text-right">
        {score}%
      </span>
    </div>
  );
}

// ── Match method pill ─────────────────────────────────────────────

function MethodPill({ method }: { method: FieldMatch["method"] }) {
  const labels: Record<string, string> = {
    exact: "Exact",
    normalized: "Normalized",
    fuzzy: "Fuzzy",
    phonetic: "Phonetic",
    token: "Token",
    contains: "Contains",
  };
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
      {labels[method] ?? method}
    </span>
  );
}

// ── Field match icon ──────────────────────────────────────────────

function FieldIcon({ field }: { field: FieldMatch["field"] }) {
  const icons: Record<string, typeof Users> = {
    name: Users,
    alias: Users,
    address: MapPin,
    country: Globe,
    id: Fingerprint,
    crypto: Bitcoin,
    vessel: Ship,
  };
  const Icon = icons[field] ?? Hash;
  return <Icon className="h-3 w-3 text-white/30" />;
}

// ── Single match row (expandable) ─────────────────────────────────

function MatchRow({ match, rank }: { match: ScreeningMatch; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const { entry, score, riskLevel, fieldMatches } = match;

  const borderColor =
    riskLevel === "CRITICAL" ? "border-l-red-500" :
    riskLevel === "HIGH" ? "border-l-[#ef4444]" :
    riskLevel === "MEDIUM" ? "border-l-[#f59e0b]" :
    "border-l-[#22c55e]";

  return (
    <>
      <tr
        className={classNames(
          "border-b border-white/5 border-l-2 cursor-pointer hover:bg-white/[0.03] transition-colors",
          borderColor
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <td className="px-3 py-3 text-center">
          <span className="text-xs text-white/30 font-[family-name:var(--font-mono)]">
            {rank}
          </span>
        </td>

        {/* Name + type */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronUp className="h-3 w-3 text-white/30 shrink-0" />
            ) : (
              <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />
            )}
            <div>
              <div className="text-sm text-white/90 font-medium">{entry.name}</div>
              <div className="text-xs text-white/40">
                {entry.entry_type} &middot; {entry.list_type}
              </div>
            </div>
          </div>
        </td>

        {/* Score */}
        <td className="px-4 py-3">
          <ScoreBar score={score} />
        </td>

        {/* Risk */}
        <td className="hidden sm:table-cell px-4 py-3">
          <RiskBadge level={riskLevel} />
        </td>

        {/* Matched Fields */}
        <td className="hidden md:table-cell px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {fieldMatches.map((fm, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-white/50"
              >
                <FieldIcon field={fm.field} />
                {fm.field}
              </span>
            ))}
          </div>
        </td>

        {/* Programs */}
        <td className="hidden lg:table-cell px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {entry.programs.slice(0, 2).map((p) => (
              <Badge key={p} code={p} size="sm" />
            ))}
            {entry.programs.length > 2 && (
              <span className="text-xs text-white/30">
                +{entry.programs.length - 2}
              </span>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr className={classNames("border-b border-white/5 border-l-2", borderColor)}>
          <td colSpan={6}>
            <MatchDetail match={match} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Expanded match detail ─────────────────────────────────────────

function MatchDetail({ match }: { match: ScreeningMatch }) {
  const { entry, fieldMatches } = match;
  const aliases = entry.aliases ?? [];
  const ids = entry.ids ?? [];
  const crypto = entry.crypto_wallets ?? [];
  const nationalities = entry.nationalities ?? [];
  const addresses = entry.addresses ?? [];

  return (
    <div className="px-6 py-4 space-y-4 bg-white/[0.02]">
      {/* Match analysis */}
      <div>
        <h4 className="text-xs text-white/50 font-medium uppercase tracking-wider mb-2">
          Match Analysis
        </h4>
        <div className="space-y-2">
          {fieldMatches.map((fm, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded bg-white/[0.03] border border-white/5"
            >
              <FieldIcon field={fm.field} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-white/50 capitalize">{fm.field}</span>
                  <MethodPill method={fm.method} />
                  <span className="text-xs font-[family-name:var(--font-mono)] text-white/70">
                    {fm.score}%
                  </span>
                </div>
                <div className="mt-1 text-xs">
                  <span className="text-white/30">Query: </span>
                  <span className="text-white/60">&quot;{fm.query}&quot;</span>
                  <span className="text-white/30"> → Matched: </span>
                  <span className="text-[#22c55e]/70">&quot;{fm.matched}&quot;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entity details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-3">
          {(entry.dob || nationalities.length > 0) && (
            <div className="flex flex-wrap gap-4">
              {entry.dob && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-white/30" />
                  <span className="text-xs text-white/40">DOB:</span>
                  <span className="text-xs text-white/70">{entry.dob}</span>
                </div>
              )}
              {nationalities.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-white/30" />
                  <span className="text-xs text-white/40">Nationality:</span>
                  <span className="text-xs text-white/70">
                    {nationalities.map(countryName).join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {entry.countries.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-white/30" />
              <span className="text-xs text-white/40">Countries:</span>
              <span className="text-xs text-white/70">
                {entry.countries.map(countryName).join(", ")}
              </span>
            </div>
          )}

          {entry.programs.length > 0 && (
            <div>
              <span className="text-xs text-white/40 block mb-1">Programs:</span>
              <div className="flex flex-wrap gap-1">
                {entry.programs.map((p) => (
                  <Badge key={p} code={p} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {addresses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="h-3 w-3 text-white/30" />
                <span className="text-xs text-white/50 font-medium">
                  Addresses ({addresses.length})
                </span>
              </div>
              <div className="space-y-1 pl-5">
                {addresses.slice(0, 4).map((a, i) => (
                  <div key={i} className="text-xs text-white/60">
                    {[a.city, a.state, a.postal_code, a.country ? countryName(a.country) : null]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                ))}
                {addresses.length > 4 && (
                  <span className="text-[11px] text-white/30">
                    +{addresses.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Aliases, IDs, Crypto */}
      {aliases.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="h-3 w-3 text-[#ec4899]/60" />
            <span className="text-xs text-white/50 font-medium">
              Aliases ({aliases.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-5">
            {aliases.slice(0, 10).map((a) => (
              <span
                key={a}
                className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5"
              >
                {a}
              </span>
            ))}
            {aliases.length > 10 && (
              <span className="text-[11px] text-white/30">
                +{aliases.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {ids.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Fingerprint className="h-3 w-3 text-[#22c55e]/60" />
            <span className="text-xs text-white/50 font-medium">
              ID Documents ({ids.length})
            </span>
          </div>
          <div className="space-y-1 pl-5">
            {ids.slice(0, 5).map((id, i) => (
              <div key={i} className="text-xs">
                <span className="text-white/60">{id.type}</span>
                <span className="text-white/30"> &mdash; </span>
                <span className="text-white/70 font-[family-name:var(--font-mono)]">
                  {id.number}
                </span>
                {id.country && (
                  <span className="text-white/30"> ({countryName(id.country)})</span>
                )}
              </div>
            ))}
            {ids.length > 5 && (
              <span className="text-[11px] text-white/30">
                +{ids.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {crypto.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bitcoin className="h-3 w-3 text-[#f97316]/60" />
            <span className="text-xs text-white/50 font-medium">
              Crypto Wallets ({crypto.length})
            </span>
          </div>
          <div className="space-y-1 pl-5">
            {crypto.slice(0, 5).map((w, i) => (
              <div key={i} className="text-xs flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f97316]/10 text-[#f97316]">
                  {w.currency}
                </span>
                <span className="text-white/60 font-[family-name:var(--font-mono)] text-[11px] truncate max-w-[400px]">
                  {w.address}
                </span>
              </div>
            ))}
            {crypto.length > 5 && (
              <span className="text-[11px] text-white/30">
                +{crypto.length - 5} more wallets
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Results summary bar ───────────────────────────────────────────

function ResultsSummary({ result }: { result: ScreeningResult }) {
  const { matches, totalScreened, duration } = result;

  const critical = matches.filter((m) => m.riskLevel === "CRITICAL").length;
  const high = matches.filter((m) => m.riskLevel === "HIGH").length;
  const medium = matches.filter((m) => m.riskLevel === "MEDIUM").length;
  const low = matches.filter((m) => m.riskLevel === "LOW").length;

  const hasHits = matches.length > 0;

  return (
    <div
      className={classNames(
        "flex flex-wrap items-center gap-4 p-3 rounded-lg border",
        hasHits
          ? "bg-[#ef4444]/5 border-[#ef4444]/20"
          : "bg-[#22c55e]/5 border-[#22c55e]/20"
      )}
    >
      <div className="flex items-center gap-2">
        {hasHits ? (
          <AlertTriangle className="h-4 w-4 text-[#ef4444]" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
        )}
        <span className={classNames("text-sm font-medium", hasHits ? "text-[#ef4444]" : "text-[#22c55e]")}>
          {hasHits
            ? `${matches.length} potential match${matches.length !== 1 ? "es" : ""} found`
            : "No matches found — clear"}
        </span>
      </div>

      {hasHits && (
        <div className="flex items-center gap-3 text-xs">
          {critical > 0 && (
            <span className="text-red-400">{critical} Critical</span>
          )}
          {high > 0 && (
            <span className="text-[#ef4444]">{high} High</span>
          )}
          {medium > 0 && (
            <span className="text-[#f59e0b]">{medium} Medium</span>
          )}
          {low > 0 && (
            <span className="text-[#22c55e]">{low} Low</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-white/30 ml-auto">
        <Clock className="h-3 w-3" />
        {duration.toFixed(0)}ms &middot; {totalScreened.toLocaleString()} entries screened
      </div>
    </div>
  );
}

// ── Main results component ────────────────────────────────────────

interface ScreeningResultsProps {
  result: ScreeningResult | null;
}

export function ScreeningResults({ result }: ScreeningResultsProps) {
  if (!result) return null;

  return (
    <div className="space-y-4">
      <ResultsSummary result={result} />

      {result.matches.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-2.5 text-center text-xs text-white/40 font-medium w-10">
                  #
                </th>
                <th className="px-4 py-2.5 text-left text-xs text-white/40 font-medium">
                  Entity
                </th>
                <th className="px-4 py-2.5 text-left text-xs text-white/40 font-medium w-36">
                  Score
                </th>
                <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs text-white/40 font-medium w-28">
                  Risk
                </th>
                <th className="hidden md:table-cell px-4 py-2.5 text-left text-xs text-white/40 font-medium">
                  Matched On
                </th>
                <th className="hidden lg:table-cell px-4 py-2.5 text-left text-xs text-white/40 font-medium">
                  Programs
                </th>
              </tr>
            </thead>
            <tbody>
              {result.matches.map((match, i) => (
                <MatchRow key={match.entry.uid} match={match} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
