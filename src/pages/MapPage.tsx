import { Globe } from "lucide-react";

export function MapPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="glass-card p-10 text-center max-w-lg">
        <Globe className="h-16 w-16 text-[#3b82f6] mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-[family-name:var(--font-mono)] mb-3">
          Interactive Sanctions Map
        </h1>
        <p className="text-white/40 text-sm">
          Map visualization coming in Phase 4. This view will feature an
          interactive choropleth map showing global sanctions density, with
          country-level drill-down and real-time change indicators.
        </p>
      </div>
    </div>
  );
}
