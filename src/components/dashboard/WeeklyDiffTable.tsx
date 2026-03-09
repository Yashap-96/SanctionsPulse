import { useState } from "react";
import { Plus, Minus, RefreshCw } from "lucide-react";
import type { WeeklyDiff, DiffEntry } from "../../lib/types";
import { classNames } from "../../lib/utils";
import { Badge } from "../common/Badge";

interface WeeklyDiffTableProps {
  diff: WeeklyDiff | null;
}

type TabKey = "additions" | "removals" | "updates";

const TABS: { key: TabKey; label: string; color: string; icon: React.ReactNode }[] = [
  { key: "additions", label: "Additions", color: "#22c55e", icon: <Plus className="h-4 w-4" /> },
  { key: "removals", label: "Removals", color: "#ef4444", icon: <Minus className="h-4 w-4" /> },
  { key: "updates", label: "Updates", color: "#f59e0b", icon: <RefreshCw className="h-4 w-4" /> },
];

function EntryRow({ entry, action }: { entry: DiffEntry; action: TabKey }) {
  const borderColor =
    action === "additions"
      ? "border-l-[#22c55e]"
      : action === "removals"
        ? "border-l-[#ef4444]"
        : "border-l-[#f59e0b]";

  const actionLabel =
    action === "additions" ? "Added" : action === "removals" ? "Removed" : "Updated";

  const actionBgColor =
    action === "additions"
      ? "bg-[#22c55e]/10 text-[#22c55e]"
      : action === "removals"
        ? "bg-[#ef4444]/10 text-[#ef4444]"
        : "bg-[#f59e0b]/10 text-[#f59e0b]";

  return (
    <tr className={classNames("border-b border-white/5 hover:bg-white/[0.02] border-l-2", borderColor)}>
      <td className="px-4 py-3 text-sm text-white/90 font-medium">{entry.name}</td>
      <td className="hidden md:table-cell px-4 py-3 text-sm text-white/50">{entry.entry_type}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {entry.programs.slice(0, 3).map((p) => (
            <Badge key={p} code={p} size="sm" />
          ))}
          {entry.programs.length > 3 && (
            <span className="text-xs text-white/30">+{entry.programs.length - 3}</span>
          )}
        </div>
      </td>
      <td className="hidden md:table-cell px-4 py-3 text-sm text-white/50">
        {entry.countries.join(", ") || "\u2014"}
      </td>
      <td className="px-4 py-3">
        <span className={classNames("text-xs font-medium px-2 py-1 rounded-full", actionBgColor)}>
          {actionLabel}
        </span>
      </td>
    </tr>
  );
}

export function WeeklyDiffTable({ diff }: WeeklyDiffTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("additions");

  if (!diff) {
    return (
      <div className="glass-card p-6">
        <p className="text-white/40 text-center">No weekly diff data available</p>
      </div>
    );
  }

  const entries: DiffEntry[] = diff[activeTab] ?? [];

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)]">
          Weekly Changes
        </h2>
        <span className="text-xs text-white/40">{diff.period}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            )}
          >
            {tab.icon}
            {tab.label}
            <span
              className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${tab.color}20`,
                color: tab.color,
              }}
            >
              {diff.summary[tab.key === "additions" ? "added" : tab.key === "removals" ? "removed" : "updated"]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
              <th className="hidden md:table-cell px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">Type</th>
              <th className="px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">Programs</th>
              <th className="hidden md:table-cell px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">Countries</th>
              <th className="px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <EntryRow key={entry.uid} entry={entry} action={activeTab} />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                  No {activeTab} this week
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
