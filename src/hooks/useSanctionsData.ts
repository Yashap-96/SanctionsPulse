import { useState, useEffect } from "react";
import type { MetaData, WeeklyDiff, SanctionsProgram } from "../lib/types";
import { API_URLS } from "../lib/constants";

interface SanctionsDataState {
  meta: MetaData | null;
  weeklyDiff: WeeklyDiff | null;
  programs: Record<string, SanctionsProgram> | null;
  loading: boolean;
  error: string | null;
}

export function useSanctionsData(): SanctionsDataState {
  const [state, setState] = useState<SanctionsDataState>({
    meta: null,
    weeklyDiff: null,
    programs: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [metaRes, programsRes] = await Promise.all([
          fetch(API_URLS.meta),
          fetch(API_URLS.programs),
        ]);

        if (!metaRes.ok) throw new Error("Failed to fetch metadata");
        if (!programsRes.ok) throw new Error("Failed to fetch programs");

        const meta: MetaData = await metaRes.json();
        const programsRaw = await programsRes.json();
        const programsList: SanctionsProgram[] = Array.isArray(programsRaw)
          ? programsRaw
          : programsRaw.programs ?? Object.values(programsRaw);
        const programs: Record<string, SanctionsProgram> = {};
        for (const p of programsList) {
          programs[p.code] = p;
        }

        // Fetch the latest diff using the date from meta
        let weeklyDiff: WeeklyDiff | null = null;
        if (meta.last_diff_date) {
          const diffRes = await fetch(
            `${API_URLS.diffs}weekly_${meta.last_diff_date}.json`
          );
          if (diffRes.ok) {
            weeklyDiff = await diffRes.json();
          }
        }

        if (!cancelled) {
          setState({
            meta,
            weeklyDiff,
            programs,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
