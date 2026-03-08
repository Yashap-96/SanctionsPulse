import { useState, useEffect } from "react";
import type { AISummary } from "../lib/types";
import { API_URLS } from "../lib/constants";

interface AISummaryState {
  summary: AISummary | null;
  loading: boolean;
  error: string | null;
}

export function useAISummary(): AISummaryState {
  const [state, setState] = useState<AISummaryState>({
    summary: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(`${API_URLS.summaries}latest.json`);
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
  }, []);

  return state;
}
