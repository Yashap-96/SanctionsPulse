import type { SanctionsProgram } from "../../lib/types";
import { formatNumber, getProgramColor } from "../../lib/utils";

interface ProgramsPanelProps {
  programs: Record<string, SanctionsProgram> | null;
}

export function ProgramsPanel({ programs }: ProgramsPanelProps) {
  if (!programs) return null;

  const sorted = Object.values(programs).sort(
    (a, b) =>
      b.entry_count_sdn +
      b.entry_count_consolidated -
      (a.entry_count_sdn + a.entry_count_consolidated)
  );

  const top = sorted.slice(0, 12);

  return (
    <div className="glass-card p-5 animate-fade-in">
      <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)] mb-4">
        Active Programs
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {top.map((program) => {
          const color = getProgramColor(program.code);
          const total = program.entry_count_sdn + program.entry_count_consolidated;
          const netChange = program.daily_added - program.daily_removed;

          return (
            <div
              key={program.code}
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="shrink-0 px-2 py-0.5 rounded text-xs font-bold font-[family-name:var(--font-mono)]"
                  style={{
                    backgroundColor: `${color}20`,
                    color: color,
                  }}
                >
                  {program.code}
                </span>
                <span className="text-sm text-white/60 truncate">
                  {program.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-sm font-semibold font-[family-name:var(--font-mono)] text-white/80">
                  {formatNumber(total)}
                </span>
                {netChange !== 0 && (
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: netChange > 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {netChange > 0 ? "+" : ""}
                    {netChange}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
