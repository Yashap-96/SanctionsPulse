import { useState } from "react";
import { Plus, Minus, RefreshCw } from "lucide-react";
import type { DailyDiff, DiffEntry } from "../../lib/types";
import { classNames, formatDate } from "../../lib/utils";
import { EntryRow } from "./EntryRow";

function formatPeriod(period: string, diffDate?: string): string {
  const dateStr = diffDate || period;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return formatDate(dateStr);
  }
  return period;
}

interface DiffTableProps {
  diff: DailyDiff | null;
}

type TabKey = "additions" | "removals" | "updates";

const TABS: { key: TabKey; label: string; color: string; icon: React.ReactNode }[] = [
  { key: "additions", label: "Additions", color: "#22c55e", icon: <Plus className="h-4 w-4" /> },
  { key: "removals", label: "Removals", color: "#ef4444", icon: <Minus className="h-4 w-4" /> },
  { key: "updates", label: "Updates", color: "#f59e0b", icon: <RefreshCw className="h-4 w-4" /> },
];

export function DiffTable({ diff }: DiffTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("additions");

  if (!diff) {
    return (
      <div className="glass-card p-6">
        <p className="text-white/40 text-center">No diff data available</p>
      </div>
    );
  }

  const entries: DiffEntry[] = diff[activeTab] ?? [];

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)]">
          Daily Changes
        </h2>
        <span className="text-xs text-white/40 font-[family-name:var(--font-mono)]">
          {formatPeriod(diff.period, diff.date)}
        </span>
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
                  No {activeTab} today
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
