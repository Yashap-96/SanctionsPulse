export const PROGRAM_COLORS: Record<string, string> = {
  IRAN: "#ef4444",
  RUSSIA: "#f59e0b",
  CUBA: "#3b82f6",
  DPRK: "#a855f7",
  SDGT: "#ec4899",
  VENEZUELA: "#14b8a6",
  SYRIA: "#f97316",
  CYBER2: "#06b6d4",
  GLOMAG: "#84cc16",
  default: "#6b7280",
};

export const MAP_CONFIG = {
  basemapUrl:
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  initialCenter: [0, 20] as [number, number],
  initialZoom: 1.8,
};

export const API_URLS = {
  meta: "/data/meta.json",
  diffs: "/data/diffs/",
  programs: "/data/programs/active_programs.json",
  countrySanctions: "/data/map/country_sanctions.json",
  summaries: "/data/summaries/",
};
