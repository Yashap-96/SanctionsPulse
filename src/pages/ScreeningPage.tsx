import { useState, useEffect, useRef, useCallback } from "react";
import {
  ScanSearch,
  AlertCircle,
  Database,
  Info,
} from "lucide-react";
import { ScreeningForm } from "../components/screening/ScreeningForm";
import { ScreeningResults } from "../components/screening/ScreeningResults";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import type { SanctionEntry } from "../lib/types";
import type { ScreeningQuery, ScreeningResult, ScreeningIndex } from "../lib/screening";
import { buildIndex, screenWithIndex } from "../lib/screening";
import { API_URLS } from "../lib/constants";
import { formatNumber } from "../lib/utils";

export function ScreeningPage() {
  const [entries, setEntries] = useState<SanctionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screening, setScreening] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const indexRef = useRef<ScreeningIndex | null>(null);

  // Load registry data and build index
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(API_URLS.registry);
        if (!res.ok) throw new Error("Failed to load sanctions registry");
        const data: SanctionEntry[] = await res.json();
        if (cancelled) return;

        setEntries(data);
        indexRef.current = buildIndex(data);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const handleScreen = useCallback(
    (query: ScreeningQuery, threshold: number) => {
      if (!indexRef.current) return;

      setScreening(true);

      // Use requestAnimationFrame to let the UI update before heavy computation
      requestAnimationFrame(() => {
        const r = screenWithIndex(query, indexRef.current!, threshold);
        setResult(r);
        setScreening(false);
      });
    },
    []
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <LoadingSpinner />
        <div className="text-center">
          <p className="text-white/60 text-sm">Loading sanctions registry...</p>
          <p className="text-white/30 text-xs mt-1">Building screening index for 19,000+ entries</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-[#ef4444] mx-auto" />
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-[#22c55e]" />
            Sanctions Screening
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Screen names, addresses, IDs, crypto wallets, and vessels against OFAC sanctions lists
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/30 shrink-0">
          <Database className="h-3 w-3" />
          {formatNumber(entries.length)} entries indexed
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#3b82f6]/5 border border-[#3b82f6]/15">
        <Info className="h-4 w-4 text-[#3b82f6] mt-0.5 shrink-0" />
        <div className="text-xs text-white/50 space-y-1">
          <p>
            <strong className="text-white/70">Unified screening engine</strong> — searches across
            entity names (with fuzzy/phonetic matching), aliases, physical addresses, country
            jurisdictions, ID documents (passport, tax ID, registration numbers), cryptocurrency
            wallet addresses, and vessel/aircraft names.
          </p>
          <p>
            Matching algorithms: exact, normalized, Levenshtein (fuzzy), Soundex (phonetic),
            token-based (handles word reordering), and substring containment. Multiple field
            matches boost the composite score.
          </p>
        </div>
      </div>

      {/* Screening form */}
      <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-xl p-5">
        <ScreeningForm onScreen={handleScreen} loading={screening} />
      </div>

      {/* Results */}
      <ScreeningResults result={result} />

      {/* Disclaimer */}
      <p className="text-[11px] text-white/20 text-center pt-2">
        This screening tool is for educational/informational purposes only. It is not a
        substitute for professional compliance screening software. Always verify matches
        against official OFAC data at{" "}
        <a
          href="https://sanctionslist.ofac.treas.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/40"
        >
          sanctionslist.ofac.treas.gov
        </a>
        .
      </p>
    </div>
  );
}
