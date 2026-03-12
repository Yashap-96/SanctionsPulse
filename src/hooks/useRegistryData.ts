import { useState, useEffect } from "react";
import type { DiffEntry } from "../lib/types";
import { API_URLS } from "../lib/constants";

interface RegistryDataState {
  entries: DiffEntry[];
  loading: boolean;
  error: string | null;
}

export function useRegistryData(): RegistryDataState {
  const [state, setState] = useState<RegistryDataState>({
    entries: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchRegistry() {
      try {
        const res = await fetch(API_URLS.registry);
        if (!res.ok) throw new Error("Failed to fetch registry");
        const entries: DiffEntry[] = await res.json();
        if (!cancelled) {
          setState({ entries, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            entries: [],
            loading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    fetchRegistry();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
