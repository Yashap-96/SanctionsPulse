import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Bitcoin,
  Users,
  Calendar,
  Globe,
  RefreshCw,
} from "lucide-react";
import type { DiffEntry } from "../../lib/types";
import { classNames } from "../../lib/utils";
import { countryName } from "../../lib/constants";
import { Badge } from "../common/Badge";

export type RowAction = "additions" | "removals" | "updates" | "registry";

function EntryDetail({ entry }: { entry: DiffEntry }) {
  const aliases = entry.aliases ?? [];
  const ids = entry.ids ?? [];
  const crypto = entry.crypto_wallets ?? [];
  const nationalities = entry.nationalities ?? [];
  const hasDetail =
    aliases.length > 0 ||
    ids.length > 0 ||
    crypto.length > 0 ||
    entry.dob ||
    nationalities.length > 0 ||
    entry.changes;

  if (!hasDetail) {
    return (
      <div className="px-6 py-3 text-xs text-white/30 italic">
        No additional details available
      </div>
    );
  }

  return (
    <div className="px-6 py-3 space-y-3 bg-white/[0.02]">
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
              <span className="text-xs text-white/70">
                {nationalities.join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {entry.changes && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <RefreshCw className="h-3 w-3 text-[#f59e0b]/60" />
            <span className="text-xs text-white/50 font-medium">Changes</span>
          </div>
          <div className="space-y-1">
            {Object.entries(entry.changes).map(
              ([field, { old: oldVal, new: newVal }]) => (
                <div key={field} className="text-xs pl-5">
                  <span className="text-white/40">{field}: </span>
                  <span className="text-[#ef4444]/70 line-through">
                    {String(oldVal)}
                  </span>
                  <span className="text-white/30"> → </span>
                  <span className="text-[#22c55e]/70">{String(newVal)}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

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
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f97316]/10 text-[#f97316]">
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

export function EntryRow({
  entry,
  action,
}: {
  entry: DiffEntry;
  action: RowAction;
}) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    action === "additions"
      ? "border-l-[#22c55e]"
      : action === "removals"
        ? "border-l-[#ef4444]"
        : action === "updates"
          ? "border-l-[#f59e0b]"
          : "border-l-white/10";

  const programs = entry.programs ?? [];
  const countries = entry.countries ?? [];
  const hasDetail =
    (entry.aliases?.length ?? 0) > 0 ||
    (entry.ids?.length ?? 0) > 0 ||
    (entry.crypto_wallets?.length ?? 0) > 0 ||
    entry.dob ||
    (entry.nationalities?.length ?? 0) > 0 ||
    entry.changes;

  // Last column: action badge for diff rows, list type badge for registry
  let badgeLabel: string;
  let badgeClass: string;
  if (action === "registry") {
    const isSdn = entry.list_type === "SDN";
    badgeLabel = isSdn ? "SDN" : "Consolidated";
    badgeClass = isSdn
      ? "bg-[#3b82f6]/10 text-[#3b82f6]"
      : "bg-[#a855f7]/10 text-[#a855f7]";
  } else {
    badgeLabel =
      action === "additions"
        ? "Added"
        : action === "removals"
          ? "Removed"
          : "Updated";
    badgeClass =
      action === "additions"
        ? "bg-[#22c55e]/10 text-[#22c55e]"
        : action === "removals"
          ? "bg-[#ef4444]/10 text-[#ef4444]"
          : "bg-[#f59e0b]/10 text-[#f59e0b]";
  }

  return (
    <>
      <tr
        className={classNames(
          "border-b border-white/5 border-l-2 transition-colors",
          hasDetail
            ? "cursor-pointer hover:bg-white/[0.03]"
            : "hover:bg-white/[0.02]",
          borderColor
        )}
        onClick={() => hasDetail && setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-sm text-white/90 font-medium">
          <div className="flex items-center gap-1.5">
            {hasDetail &&
              (expanded ? (
                <ChevronUp className="h-3 w-3 text-white/30 shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />
              ))}
            {entry.name}
          </div>
        </td>
        <td className="hidden md:table-cell px-4 py-3 text-sm text-white/50">
          {entry.entry_type ?? "\u2014"}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {programs.length > 0 ? (
              <>
                {programs.slice(0, 3).map((p) => (
                  <Badge key={p} code={p} size="sm" />
                ))}
                {programs.length > 3 && (
                  <span className="text-xs text-white/30">
                    +{programs.length - 3}
                  </span>
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
          {countries.length > 0
            ? countries.map((c) => countryName(c)).join(", ")
            : "\u2014"}
        </td>
        <td className="px-4 py-3">
          <span
            className={classNames(
              "text-xs font-medium px-2 py-1 rounded-full",
              badgeClass
            )}
          >
            {badgeLabel}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr
          className={classNames(
            "border-b border-white/5 border-l-2",
            borderColor
          )}
        >
          <td colSpan={5}>
            <EntryDetail entry={entry} />
          </td>
        </tr>
      )}
    </>
  );
}
