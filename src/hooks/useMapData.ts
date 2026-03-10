import { useState, useEffect } from "react";
import type { CountrySanctionData } from "../lib/types";
import { API_URLS } from "../lib/constants";

interface RawCountryData {
  country: string;
  iso2: string;
  total: number;
  sdn: number;
  consolidated: number;
  programs: string[];
  daily_added: number;
  daily_removed: number;
}

interface MapDataState {
  countryData: Record<string, CountrySanctionData> | null;
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

        const raw: Record<string, RawCountryData> = await res.json();

        const countryData: Record<string, CountrySanctionData> = {};
        for (const [iso2, entry] of Object.entries(raw)) {
          countryData[iso2] = {
            iso2: entry.iso2,
            name: entry.country,
            total: entry.total,
            sdn: entry.sdn,
            consolidated: entry.consolidated,
            programs: entry.programs,
            daily_added: entry.daily_added,
            daily_removed: entry.daily_removed,
          };
        }

        if (!cancelled) {
          setState({ countryData, loading: false, error: null });
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
