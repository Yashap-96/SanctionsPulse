import { Activity } from "lucide-react";
import type { WeeklyDiff, DiffEntry } from "../../lib/types";
import { classNames } from "../../lib/utils";
import { Badge } from "../common/Badge";

interface RecentActionsProps {
  diff: WeeklyDiff | null;
}

interface ActionItem {
  entry: DiffEntry;
  action: "added" | "removed";
}

export function RecentActions({ diff }: RecentActionsProps) {
  if (!diff) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-[#a855f7]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)]">
            Recent Actions
          </h2>
        </div>
        <p className="text-white/40 text-sm text-center py-6">
          No recent actions available
        </p>
      </div>
    );
  }

  const items: ActionItem[] = [
    ...diff.additions.map((entry) => ({ entry, action: "added" as const })),
    ...diff.removals.map((entry) => ({ entry, action: "removed" as const })),
  ].slice(0, 8);

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#a855f7]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)]">
            Recent Actions
          </h2>
        </div>
        <span className="text-xs text-white/40">{diff.period}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-6">
          No actions this week
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={`${item.action}-${item.entry.uid}`}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              {/* Colored dot */}
              <span
                className={classNames(
                  "flex-shrink-0 w-2 h-2 rounded-full mt-1.5",
                  item.action === "added" ? "bg-[#22c55e]" : "bg-[#ef4444]"
                )}
              />

              <div className="flex-1 min-w-0">
                {/* Entity name + type */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/90 font-medium truncate">
                    {item.entry.name}
                  </span>
                  <span
                    className={classNames(
                      "flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      item.action === "added"
                        ? "bg-[#22c55e]/10 text-[#22c55e]"
                        : "bg-[#ef4444]/10 text-[#ef4444]"
                    )}
                  >
                    {item.action === "added" ? "Added" : "Removed"}
                  </span>
                </div>

                {/* Type + programs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-white/30">
                    {item.entry.entry_type}
                  </span>
                  {item.entry.programs.slice(0, 2).map((p) => (
                    <Badge key={p} code={p} size="sm" />
                  ))}
                  {item.entry.programs.length > 2 && (
                    <span className="text-[10px] text-white/30">
                      +{item.entry.programs.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
