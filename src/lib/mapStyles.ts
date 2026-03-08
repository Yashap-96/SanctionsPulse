export const DARK_BASEMAP =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const choroplethPaint = {
  "fill-color": [
    "interpolate",
    ["linear"],
    ["get", "total"],
    0,
    "#1a1a2e",
    10,
    "#16213e",
    50,
    "#0f3460",
    100,
    "#533483",
    250,
    "#e94560",
    500,
    "#ff6b6b",
    1000,
    "#ff0000",
  ],
  "fill-opacity": [
    "case",
    ["boolean", ["feature-state", "hover"], false],
    0.85,
    0.6,
  ],
};

export const bubblePaint = {
  "circle-radius": [
    "interpolate",
    ["linear"],
    ["get", "total"],
    0,
    3,
    50,
    8,
    200,
    15,
    500,
    22,
    1000,
    30,
  ],
  "circle-color": [
    "case",
    [">", ["get", "net_change"], 0],
    "#22c55e",
    ["<", ["get", "net_change"], 0],
    "#ef4444",
    "#6b7280",
  ],
  "circle-opacity": 0.7,
  "circle-stroke-width": 1,
  "circle-stroke-color": "rgba(255, 255, 255, 0.3)",
};
