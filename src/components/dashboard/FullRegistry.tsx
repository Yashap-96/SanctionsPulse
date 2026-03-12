import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { DiffEntry } from "../../lib/types";
import { classNames, formatNumber } from "../../lib/utils";
import { countryName } from "../../lib/constants";
import { EntryRow } from "./EntryRow";

const PAGE_SIZE = 50;

interface FullRegistryProps {
  entries: DiffEntry[];
  loading?: boolean;
}

export function FullRegistry({ entries, loading }: FullRegistryProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [search, setSearch] = useState("");
  const [entryType, setEntryType] = useState("All");
  const [listType, setListType] = useState("All");
  const [program, setProgram] = useState("All");
  const [country, setCountry] = useState("All");
  const [page, setPage] = useState(1);

  const uniquePrograms = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.programs?.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [entries]);

  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.countries?.forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) =>
      countryName(a).localeCompare(countryName(b))
    );
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.programs?.some((p) => p.toLowerCase().includes(q)) ||
          e.countries?.some(
            (c) =>
              c.toLowerCase().includes(q) ||
              countryName(c).toLowerCase().includes(q)
          )
      );
    }
    if (entryType !== "All") {
      result = result.filter((e) => e.entry_type === entryType);
    }
    if (listType !== "All") {
      result = result.filter((e) => e.list_type === listType);
    }
    if (program !== "All") {
      result = result.filter((e) => e.programs?.includes(program));
    }
    if (country !== "All") {
      result = result.filter((e) => e.countries?.includes(country));
    }

    return result;
  }, [entries, search, entryType, listType, program, country]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, entryType, listType, program, country]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEntries = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const selectClass =
    "bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 px-3 py-2 outline-none focus:border-white/20 transition-colors";

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-[#3b82f6]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-mono)]">
            Full Sanctions Registry
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] font-[family-name:var(--font-mono)]">
            {formatNumber(entries.length)} entries
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronUp className="h-4 w-4 text-white/40" />
        )}
      </button>

      {!collapsed && (
        <>
          {loading && (
            <div className="px-5 py-8 text-center text-white/40 text-sm">
              Loading registry data...
            </div>
          )}
          {!loading && <>
          {/* Filters */}
          <div className="px-5 pb-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                placeholder="Search by name, program, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white/90 pl-10 pr-4 py-2.5 outline-none focus:border-white/20 placeholder:text-white/25 transition-colors"
              />
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap gap-3">
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                className={selectClass}
              >
                <option value="All">All Types</option>
                <option value="Entity">Entity</option>
                <option value="Individual">Individual</option>
                <option value="Vessel">Vessel</option>
                <option value="Aircraft">Aircraft</option>
              </select>

              <select
                value={listType}
                onChange={(e) => setListType(e.target.value)}
                className={selectClass}
              >
                <option value="All">All Lists</option>
                <option value="SDN">SDN</option>
                <option value="Consolidated">Consolidated</option>
              </select>

              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className={selectClass}
              >
                <option value="All">All Programs ({uniquePrograms.length})</option>
                {uniquePrograms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={selectClass}
              >
                <option value="All">All Countries ({uniqueCountries.length})</option>
                {uniqueCountries.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c)}
                  </option>
                ))}
              </select>

              <div className="flex items-center ml-auto">
                <span className="text-xs text-white/40 font-[family-name:var(--font-mono)]">
                  {formatNumber(filtered.length)} results
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="hidden md:table-cell px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    Programs
                  </th>
                  <th className="hidden md:table-cell px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    Countries
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    List
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.length > 0 ? (
                  pageEntries.map((entry) => (
                    <EntryRow
                      key={entry.uid}
                      entry={entry}
                      action="registry"
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-white/30 text-sm"
                    >
                      No entries match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <span className="text-xs text-white/40 font-[family-name:var(--font-mono)]">
                Page {page} of {formatNumber(totalPages)}
              </span>
              <div className="flex items-center gap-1">
                <PaginationButton
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  label="First"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </PaginationButton>
                <PaginationButton
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  label="Previous"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </PaginationButton>
                <PaginationButton
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  label="Next"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </PaginationButton>
                <PaginationButton
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  label="Last"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </PaginationButton>
              </div>
            </div>
          )}
          </>}
        </>
      )}
    </div>
  );
}

function PaginationButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={classNames(
        "p-2 rounded-lg transition-colors",
        disabled
          ? "text-white/15 cursor-not-allowed"
          : "text-white/50 hover:text-white/80 hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
