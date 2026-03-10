import { useState } from "react";
import { Plus, Minus, RefreshCw, ChevronDown, ChevronUp, Fingerprint, Bitcoin, Users, Calendar, Globe } from "lucide-react";
import type { WeeklyDiff, DiffEntry } from "../../lib/types";
import { classNames, formatDate } from "../../lib/utils";
import { Badge } from "../common/Badge";

function formatPeriod(period: string, diffDate?: string): string {
  const rangeMatch = period.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/);
  if (rangeMatch) {
    return `${formatDate(rangeMatch[1])} — ${formatDate(rangeMatch[2])}`;
  }
  if (diffDate) {
    try {
      const end = new Date(diffDate);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return `${formatDate(start.toISOString().slice(0, 10))} — ${formatDate(diffDate)}`;
    } catch {
      // ignore
    }
  }
  return period;
}

interface WeeklyDiffTableProps {
  diff: WeeklyDiff | null;
}

type TabKey = "additions" | "removals" | "updates";

const TABS: { key: TabKey; label: string; color: string; icon: React.ReactNode }[] = [
  { key: "additions", label: "Additions", color: "#22c55e", icon: <Plus className="h-4 w-4" /> },
  { key: "removals", label: "Removals", color: "#ef4444", icon: <Minus className="h-4 w-4" /> },
  { key: "updates", label: "Updates", color: "#f59e0b", icon: <RefreshCw className="h-4 w-4" /> },
];

function EntryDetail({ entry }: { entry: DiffEntry }) {
  const aliases = entry.aliases ?? [];
  const ids = entry.ids ?? [];
  const crypto = entry.crypto_wallets ?? [];
  const nationalities = entry.nationalities ?? [];
  const hasDetail = aliases.length > 0 || ids.length > 0 || crypto.length > 0 || entry.dob || nationalities.length > 0 || entry.changes;

  if (!hasDetail) {
    return (
      <div className="px-6 py-3 text-xs text-white/30 italic">
        No additional details available
      </div>
    );
  }

  return (
    <div className="px-6 py-3 space-y-3 bg-white/[0.02]">
      {/* DOB & Nationalities */}
      {(entry.dob || nationalities.length > 0) && (
        <div className="flex flex-wrap gap-4">
          {entry.dob && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-white/30" />
              <span className="text-xs text-white/40">DOB:</span>
              <span className="text-xs text-white/70">{entry.dob}</span>
            </div>
          )}
          {nationalities.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-white/30" />
              <span className="text-xs text-white/40">Nationality:</span>
              <span className="text-xs text-white/70">{nationalities.join(", ")}</span>
            </div>
          )}
        </div>
      )}

      {/* Changes (for updates) */}
      {entry.changes && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <RefreshCw className="h-3 w-3 text-[#f59e0b]/60" />
            <span className="text-xs text-white/50 font-medium">Changes</span>
          </div>
          <div className="space-y-1">
            {Object.entries(entry.changes).map(([field, { old: oldVal, new: newVal }]) => (
              <div key={field} className="text-xs pl-5">
                <span className="text-white/40">{field}: </span>
                <span className="text-[#ef4444]/70 line-through">{String(oldVal)}</span>
                <span className="text-white/30"> → </span>
                <span className="text-[#22c55e]/70">{String(newVal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aliases */}
      {aliases.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="h-3 w-3 text-[#ec4899]/60" />
            <span className="text-xs text-white/50 font-medium">
              Aliases ({aliases.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-5">
            {aliases.slice(0, 8).map((a) => (
              <span
                key={a}
                className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/5"
              >
                {a}
              </span>
            ))}
            {aliases.length > 8 && (
              <span className="text-[11px] text-white/30">
                +{aliases.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* ID Documents */}
      {ids.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Fingerprint className="h-3 w-3 text-[#22c55e]/60" />
            <span className="text-xs text-white/50 font-medium">
              ID Documents ({ids.length})
            </span>
          </div>
          <div className="space-y-1 pl-5">
            {ids.slice(0, 5).map((id, i) => (
              <div key={i} className="text-xs">
                <span className="text-white/60">{id.type}</span>
                <span className="text-white/30"> — </span>
                <span className="text-white/70 font-[family-name:var(--font-mono)]">
                  {id.number}
                </span>
                {id.country && (
                  <span className="text-white/30"> ({id.country})</span>
                )}
              </div>
            ))}
            {ids.length > 5 && (
              <div className="text-[11px] text-white/30">
                +{ids.length - 5} more documents
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crypto Wallets */}
      {crypto.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bitcoin className="h-3 w-3 text-[#f97316]/60" />
            <span className="text-xs text-white/50 font-medium">
              Crypto Wallets ({crypto.length})
            </span>
          </div>
          <div className="space-y-1 pl-5">
            {crypto.slice(0, 5).map((w, i) => (
              <div key={i} className="text-xs flex items-center gap-2">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f97316]/10 text-[#f97316]"
                >
                  {w.currency}
                </span>
                <span className="text-white/60 font-[family-name:var(--font-mono)] text-[11px] truncate max-w-[300px]">
                  {w.address}
                </span>
              </div>
            ))}
            {crypto.length > 5 && (
              <div className="text-[11px] text-white/30">
                +{crypto.length - 5} more wallets
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry, action }: { entry: DiffEntry; action: TabKey }) {
  const [expanded, setExpanded] = useState(false);

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

  const programs = entry.programs ?? [];
  const countries = entry.countries ?? [];
  const hasDetail =
    (entry.aliases?.length ?? 0) > 0 ||
    (entry.ids?.length ?? 0) > 0 ||
    (entry.crypto_wallets?.length ?? 0) > 0 ||
    entry.dob ||
    (entry.nationalities?.length ?? 0) > 0 ||
    entry.changes;

  return (
    <>
      <tr
        className={classNames(
          "border-b border-white/5 border-l-2 transition-colors",
          hasDetail ? "cursor-pointer hover:bg-white/[0.03]" : "hover:bg-white/[0.02]",
          borderColor
        )}
        onClick={() => hasDetail && setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-sm text-white/90 font-medium">
          <div className="flex items-center gap-1.5">
            {hasDetail && (
              expanded
                ? <ChevronUp className="h-3 w-3 text-white/30 shrink-0" />
                : <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />
            )}
            {entry.name}
          </div>
        </td>
        <td className="hidden md:table-cell px-4 py-3 text-sm text-white/50">{entry.entry_type ?? "\u2014"}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {programs.length > 0 ? (
              <>
                {programs.slice(0, 3).map((p) => (
                  <Badge key={p} code={p} size="sm" />
                ))}
                {programs.length > 3 && (
                  <span className="text-xs text-white/30">+{programs.length - 3}</span>
                )}
              </>
            ) : entry.changes ? (
              <span className="text-xs text-white/40 italic">
                {Object.keys(entry.changes).join(", ")} changed
              </span>
            ) : (
              <span className="text-xs text-white/30">{"\u2014"}</span>
            )}
          </div>
        </td>
        <td className="hidden md:table-cell px-4 py-3 text-sm text-white/50">
          {countries.join(", ") || "\u2014"}
        </td>
        <td className="px-4 py-3">
          <span className={classNames("text-xs font-medium px-2 py-1 rounded-full", actionBgColor)}>
            {actionLabel}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr className={classNames("border-b border-white/5 border-l-2", borderColor)}>
          <td colSpan={5}>
            <EntryDetail entry={entry} />
          </td>
        </tr>
      )}
    </>
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
