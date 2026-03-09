import { useSanctionsData } from "../hooks/useSanctionsData";
import { StatsCards } from "../components/dashboard/StatsCards";
import { WeeklyDiffTable } from "../components/dashboard/WeeklyDiffTable";
import { ProgramsPanel } from "../components/dashboard/ProgramsPanel";
import { TimelineChart } from "../components/dashboard/TimelineChart";
import { RecentActions } from "../components/dashboard/RecentActions";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export function DashboardPage() {
  const { meta, weeklyDiff, programs, loading, error } = useSanctionsData();

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
      <StatsCards meta={meta} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <WeeklyDiffTable diff={weeklyDiff} />
        </div>
        <div className="space-y-6">
          <RecentActions diff={weeklyDiff} />
          <TimelineChart />
        </div>
      </div>
      <ProgramsPanel programs={programs} />
    </div>
  );
}
