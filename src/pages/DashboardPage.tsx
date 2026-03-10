import { useSanctionsData } from "../hooks/useSanctionsData";
import { InfoBanner } from "../components/dashboard/InfoBanner";
import { StatsCards } from "../components/dashboard/StatsCards";
import { DataOverview } from "../components/dashboard/DataOverview";
import { DiffTable } from "../components/dashboard/WeeklyDiffTable";
import { ProgramsPanel } from "../components/dashboard/ProgramsPanel";
import { TimelineChart } from "../components/dashboard/TimelineChart";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export function DashboardPage() {
  const { meta, latestDiff, programs, loading, error } = useSanctionsData();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-card p-6 max-w-md text-center">
          <p className="text-[#ef4444] font-semibold mb-2">Error loading data</p>
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InfoBanner />
      <StatsCards meta={meta} />
      <DataOverview />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DiffTable diff={latestDiff} />
        </div>
        <div>
          <TimelineChart />
        </div>
      </div>
      <ProgramsPanel programs={programs} />
    </div>
  );
}
