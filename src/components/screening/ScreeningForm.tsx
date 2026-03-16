import { useState } from "react";
import {
  Search,
  User,
  MapPin,
  Globe,
  Fingerprint,
  Bitcoin,
  Ship,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import type { ScreeningQuery } from "../../lib/screening";
import { classNames } from "../../lib/utils";

interface ScreeningFormProps {
  onScreen: (query: ScreeningQuery, threshold: number) => void;
  loading: boolean;
}

export function ScreeningForm({ onScreen, loading }: ScreeningFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [threshold, setThreshold] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasInput =
    name || address || country || idNumber || cryptoAddress || vesselName;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasInput) return;

    onScreen(
      {
        name: name.trim() || undefined,
        address: address.trim() || undefined,
        country: country.trim() || undefined,
        idNumber: idNumber.trim() || undefined,
        cryptoAddress: cryptoAddress.trim() || undefined,
        vesselName: vesselName.trim() || undefined,
      },
      threshold
    );
  }

  function handleReset() {
    setName("");
    setAddress("");
    setCountry("");
    setIdNumber("");
    setCryptoAddress("");
    setVesselName("");
    setThreshold(50);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Primary: Name field */}
      <div>
        <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5">
          <User className="h-3.5 w-3.5" />
          Entity / Individual Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., ACME Trading LLC, Mohammad Ali..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/25 transition-colors"
          />
          <Search className="absolute right-3 top-3.5 h-4 w-4 text-white/20" />
        </div>
        <p className="text-[11px] text-white/30 mt-1">
          Fuzzy matching: handles typos, transliterations, aliases, and name reordering
        </p>
      </div>

      {/* Secondary fields row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., Havana, Malecon 123..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/25 transition-colors"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5">
            <Globe className="h-3.5 w-3.5" />
            Country (ISO2)
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="e.g., IR, CU, RU..."
            maxLength={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/25 transition-colors uppercase"
          />
        </div>
      </div>

      {/* Advanced fields toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white/70 transition-colors"
      >
        {showAdvanced ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        Advanced Screening Fields
      </button>

      {showAdvanced && (
        <div className="space-y-3 pl-2 border-l-2 border-white/5">
          <div>
            <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5">
              <Fingerprint className="h-3.5 w-3.5" />
              ID / Passport Number
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g., A12345678, 98-7654321..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/25 transition-colors"
            />
            <p className="text-[11px] text-white/30 mt-1">
              Exact match against passport, tax ID, registration, and other ID documents
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5">
              <Bitcoin className="h-3.5 w-3.5" />
              Crypto Wallet Address
            </label>
            <input
              type="text"
              value={cryptoAddress}
              onChange={(e) => setCryptoAddress(e.target.value)}
              placeholder="e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/25 transition-colors font-[family-name:var(--font-mono)] text-xs"
            />
            <p className="text-[11px] text-white/30 mt-1">
              Exact match against OFAC-listed BTC, ETH, USDT, XBT, and other crypto addresses
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-white/60 mb-1.5">
              <Ship className="h-3.5 w-3.5" />
              Vessel / Aircraft Name
            </label>
            <input
              type="text"
              value={vesselName}
              onChange={(e) => setVesselName(e.target.value)}
              placeholder="e.g., WISE HONEST, M/T FORTUNE..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/25 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Threshold slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-white/60">
            Match Threshold
          </label>
          <span className="text-sm font-[family-name:var(--font-mono)] text-white/80">
            {threshold}%
          </span>
        </div>
        <input
          type="range"
          min={30}
          max={100}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-[#22c55e] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
          <span>Broad (30%)</span>
          <span>Strict (100%)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!hasInput || loading}
          className={classNames(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
            hasInput && !loading
              ? "bg-[#22c55e] text-black hover:bg-[#22c55e]/90 shadow-lg shadow-[#22c55e]/20"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          )}
        >
          <Search className="h-4 w-4" />
          {loading ? "Screening..." : "Screen"}
        </button>

        {hasInput && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
