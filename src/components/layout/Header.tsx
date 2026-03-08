import { Zap } from "lucide-react";
import type { MetaData } from "../../lib/types";
import { formatNumber, formatDate } from "../../lib/utils";

interface HeaderProps {
  meta: MetaData | null;
}

export function Header({ meta }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-[#22c55e]" />
          <h1 className="text-xl font-bold tracking-wider font-[family-name:var(--font-mono)] uppercase">
            SanctionsPulse
          </h1>
          <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse-live absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]" />
            </span>
            <span className="text-xs font-semibold text-[#22c55e] tracking-wider uppercase">
              Live
            </span>
          </div>
        </div>

        {meta && (
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <div>
              <span className="text-white/40 mr-1">Updated:</span>
              <span className="text-white/80">{formatDate(meta.last_updated)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40">SDN:</span>
              <span className="text-[#3b82f6] font-semibold font-[family-name:var(--font-mono)]">
                {formatNumber(meta.sdn_total)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/40">Consolidated:</span>
              <span className="text-[#a855f7] font-semibold font-[family-name:var(--font-mono)]">
                {formatNumber(meta.consolidated_total)}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
