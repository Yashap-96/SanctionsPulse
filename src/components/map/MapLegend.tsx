const COLOR_STOPS = [
  { value: "0", color: "#1a1a2e" },
  { value: "10", color: "#16213e" },
  { value: "50", color: "#0f3460" },
  { value: "100", color: "#533483" },
  { value: "250", color: "#e94560" },
  { value: "500", color: "#ff6b6b" },
  { value: "1000+", color: "#ff0000" },
];

export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="glass-card p-3 text-xs space-y-3 min-w-[140px]">
        {/* Choropleth scale */}
        <div>
          <div className="text-white/50 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
            Sanctions Count
          </div>
          <div className="flex rounded overflow-hidden h-2.5">
            {COLOR_STOPS.map((stop) => (
              <div
                key={stop.value}
                className="flex-1"
                style={{ backgroundColor: stop.color }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-white/40 text-[9px]">
            <span>0</span>
            <span>100</span>
            <span>500</span>
            <span>1k+</span>
          </div>
        </div>

        {/* Daily changes */}
        <div>
          <div className="text-white/50 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
            Daily Changes
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              />
              <span className="text-white/60">Net additions</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#ef4444" }}
              />
              <span className="text-white/60">Net removals</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "#6b7280" }}
              />
              <span className="text-white/60">No change</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
