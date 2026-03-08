import { Brain } from "lucide-react";

export function IntelligencePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="glass-card p-10 text-center max-w-lg">
        <Brain className="h-16 w-16 text-[#06b6d4] mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-[family-name:var(--font-mono)] mb-3">
          AI Intelligence Center
        </h1>
        <p className="text-white/40 text-sm">
          AI-powered sanctions intelligence coming soon. This view will feature
          executive summaries, risk assessments, and compliance recommendations
          generated from weekly OFAC changes.
        </p>
      </div>
    </div>
  );
}
