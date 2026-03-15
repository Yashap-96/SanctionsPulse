import { useState, useEffect } from "react";
import { API_URLS } from "../lib/constants";

export interface TimelineDay {
  date: string;
  additions: number;
  removals: number;
  updates: number;
}

export interface TimelineData {
  period_start: string;
  period_end: string;
  window_days: number;
  total_additions: number;
  total_removals: number;
  total_updates: number;
  days: TimelineDay[];
}

interface TimelineDataState {
  timeline: TimelineData | null;
  loading: boolean;
  error: string | null;
}

export function useTimelineData(): TimelineDataState {
  const [state, setState] = useState<TimelineDataState>({
    timeline: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchTimeline() {
      try {
        const res = await fetch(API_URLS.timeline);
        if (!res.ok) throw new Error("Failed to fetch timeline");
        const timeline: TimelineData = await res.json();
        if (!cancelled) {
          setState({ timeline, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            timeline: null,
            loading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    fetchTimeline();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
