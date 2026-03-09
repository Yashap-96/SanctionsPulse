import { useState } from "react";
import { useMapData } from "../hooks/useMapData";
import { SanctionsMap } from "../components/map/SanctionsMap";
import { MapLegend } from "../components/map/MapLegend";
import { MapControls, type MapFilter } from "../components/map/MapControls";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export function MapPage() {
  const { countryData, loading, error } = useMapData();
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !countryData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-card p-6 text-center">
          <p className="text-red-400 text-sm">
            {error ?? "Failed to load map data"}
          </p>
        </div>
      </div>
    );
  }

  // Apply filter to country data
  const filteredData = Object.fromEntries(
    Object.entries(countryData).map(([iso2, data]) => {
      if (activeFilter === "sdn") {
        return [iso2, { ...data, total: data.sdn }];
      }
      if (activeFilter === "consolidated") {
        return [iso2, { ...data, total: data.consolidated }];
      }
      return [iso2, data];
    })
  );

  return (
    <div className="-m-6 relative" style={{ height: "calc(100vh - 64px)" }}>
      <SanctionsMap key={activeFilter} countryData={filteredData} />
      <MapLegend />
      <MapControls activeFilter={activeFilter} onFilterChange={setActiveFilter} />
    </div>
  );
}
