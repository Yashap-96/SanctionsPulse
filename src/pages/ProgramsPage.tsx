import { useState, useMemo } from "react";
import { Shield, Search, ArrowUpDown, Database, TrendingUp, TrendingDown } from "lucide-react";
import { useSanctionsData } from "../hooks/useSanctionsData";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Badge } from "../components/common/Badge";
import { formatNumber, formatDate } from "../lib/utils";
import type { SanctionsProgram } from "../lib/types";

type SortOption = "entries" | "recent" | "active";

export function ProgramsPage() {
  const { programs, loading, error } = useSanctionsData();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("entries");

  const programList = useMemo(() => {
    if (!programs) return [];
    let list = Object.values(programs);

    // Filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sort) {
        case "entries":
          return (
            b.entry_count_sdn +
            b.entry_count_consolidated -
            (a.entry_count_sdn + a.entry_count_consolidated)
          );
        case "recent":
          return (
            new Date(b.last_updated).getTime() -
            new Date(a.last_updated).getTime()
          );
        case "active":
          return (
            b.weekly_added +
            b.weekly_removed -
            (a.weekly_added + a.weekly_removed)
          );
        default:
          return 0;
      }
    });

    return list;
  }, [programs, search, sort]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="glass-card p-6 max-w-md text-center">
          <p className="text-[#ef4444] font-semibold mb-2">Error loading data</p>
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalPrograms = programs ? Object.keys(programs).length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-[#a855f7]" />
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-mono)]">
            Sanctions Programs
          </h1>
          <p className="text-white/40 text-sm">
            {formatNumber(totalPrograms)} active programs tracked
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search programs by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#a855f7]/50 transition-colors"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-8 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-[#a855f7]/50 transition-colors"
          >
            <option value="entries">Most Entries</option>
            <option value="recent">Most Recent</option>
            <option value="active">Most Active This Week</option>
          </select>
        </div>
      </div>

      {/* Programs Grid */}
      {programList.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Search className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">
            No programs match your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {programList.map((program) => (
            <ProgramCard key={program.code} program={program} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program }: { program: SanctionsProgram }) {
  const total = program.entry_count_sdn + program.entry_count_consolidated;
  const sdnPct = total > 0 ? (program.entry_count_sdn / total) * 100 : 0;

  return (
    <div className="glass-card p-5 space-y-4 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Badge code={program.code} size="md" />
        <h3 className="text-sm font-semibold text-white/90 leading-tight flex-1 min-w-0">
          {program.name}
        </h3>
      </div>

      {/* Description */}
      <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
        {program.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-white/30 mb-0.5">Total</div>
          <div className="text-sm font-semibold font-[family-name:var(--font-mono)] text-white/80 flex items-center gap-1">
            <Database className="h-3 w-3 text-white/30" />
            {formatNumber(total)}
          </div>
        </div>
        <div>
          <div className="text-xs text-white/30 mb-0.5">SDN</div>
          <div className="text-sm font-semibold font-[family-name:var(--font-mono)] text-white/80">
            {formatNumber(program.entry_count_sdn)}
          </div>
        </div>
        <div>
          <div className="text-xs text-white/30 mb-0.5">Consolidated</div>
          <div className="text-sm font-semibold font-[family-name:var(--font-mono)] text-white/80">
            {formatNumber(program.entry_count_consolidated)}
          </div>
        </div>
      </div>

      {/* SDN vs Consolidated bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#3b82f6]"
          style={{ width: `${sdnPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/30 -mt-2">
        <span>SDN {sdnPct.toFixed(0)}%</span>
        <span>Consolidated {(100 - sdnPct).toFixed(0)}%</span>
      </div>

      {/* Weekly Activity + Last Updated */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          {program.weekly_added > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-[#22c55e]">
              <TrendingUp className="h-3 w-3" />
              +{program.weekly_added}
            </span>
          )}
          {program.weekly_removed > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-[#ef4444]">
              <TrendingDown className="h-3 w-3" />
              -{program.weekly_removed}
            </span>
          )}
          {program.weekly_added === 0 && program.weekly_removed === 0 && (
            <span className="text-xs text-white/20">No weekly changes</span>
          )}
        </div>
        <span className="text-[10px] text-white/25">
          {formatDate(program.last_updated)}
        </span>
      </div>
    </div>
  );
}
