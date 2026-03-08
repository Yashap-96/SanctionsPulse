import { useState, useEffect } from "react";
import type { CountrySanctionData } from "../lib/types";
import { API_URLS } from "../lib/constants";

interface MapDataState {
  countryData: CountrySanctionData[] | null;
  loading: boolean;
  error: string | null;
}

export function useMapData(): MapDataState {
  const [state, setState] = useState<MapDataState>({
    countryData: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(API_URLS.countrySanctions);
        if (!res.ok) throw new Error("Failed to fetch country sanctions data");

        const data: CountrySanctionData[] = await res.json();

        if (!cancelled) {
          setState({ countryData: data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            countryData: null,
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
