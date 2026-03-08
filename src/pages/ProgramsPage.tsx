import { Shield } from "lucide-react";

export function ProgramsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="glass-card p-10 text-center max-w-lg">
        <Shield className="h-16 w-16 text-[#a855f7] mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-[family-name:var(--font-mono)] mb-3">
          Programs Explorer
        </h1>
        <p className="text-white/40 text-sm">
          Detailed sanctions program analysis coming soon. This view will
          provide deep dives into each OFAC program, historical trends,
          and entity breakdowns.
        </p>
      </div>
    </div>
  );
}
