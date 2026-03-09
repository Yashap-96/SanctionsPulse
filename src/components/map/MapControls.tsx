export type MapFilter = "all" | "sdn" | "consolidated";

interface MapControlsProps {
  activeFilter: MapFilter;
  onFilterChange: (filter: MapFilter) => void;
}

const FILTERS: { value: MapFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sdn", label: "SDN Only" },
  { value: "consolidated", label: "Consolidated Only" },
];

export function MapControls({ activeFilter, onFilterChange }: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="glass-card p-1.5 flex gap-1">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              activeFilter === value
                ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
