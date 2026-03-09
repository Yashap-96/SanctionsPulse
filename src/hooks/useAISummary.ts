import { useState, useEffect } from "react";
import type { AISummary } from "../lib/types";
import { API_URLS } from "../lib/constants";

interface AISummaryState {
  summary: AISummary | null;
  loading: boolean;
  error: string | null;
}

export function useAISummary(diffDate?: string): AISummaryState {
  const [state, setState] = useState<AISummaryState>({
    summary: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        let date = diffDate;

        // If no date provided, fetch meta to get last_diff_date
        if (!date) {
          const metaRes = await fetch("/data/meta.json");
          if (metaRes.ok) {
            const meta = await metaRes.json();
            date = meta.last_diff_date;
          }
        }

        if (!date) {
          throw new Error("Could not determine summary date");
        }

        const res = await fetch(
          `${API_URLS.summaries}ai_summary_${date}.json`
        );
        if (!res.ok) throw new Error("Failed to fetch AI summary");

        const summary: AISummary = await res.json();

        if (!cancelled) {
          setState({ summary, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            summary: null,
            loading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [diffDate]);

  return state;
}
