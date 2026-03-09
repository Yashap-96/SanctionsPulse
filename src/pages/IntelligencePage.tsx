import { Brain, AlertCircle } from "lucide-react";
import { useSanctionsData } from "../hooks/useSanctionsData";
import { useAISummary } from "../hooks/useAISummary";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { AISummaryPanel } from "../components/intelligence/AISummaryPanel";

export function IntelligencePage() {
  const { meta } = useSanctionsData();
  const { summary, loading, error } = useAISummary(meta?.last_diff_date);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !summary) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-[#06b6d4]" />
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-mono)]">
              Intelligence Center
            </h1>
          </div>
        </div>
        <div className="glass-card p-10 text-center max-w-lg mx-auto">
          <AlertCircle className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">
            {error
              ? `Error loading intelligence data: ${error}`
              : "AI intelligence summaries are generated weekly following OFAC list updates. Check back after the next update cycle."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="h-7 w-7 text-[#06b6d4]" />
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-mono)]">
            Intelligence Center
          </h1>
          <p className="text-white/40 text-sm">
            AI-generated analysis for {summary.period}
          </p>
        </div>
      </div>

      <AISummaryPanel summary={summary} />
    </div>
  );
}
