import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  Shield,
  Brain,
  ScanSearch,
  Menu,
  X,
} from "lucide-react";
import { classNames } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Map", icon: Globe },
  { to: "/programs", label: "Programs", icon: Shield },
  { to: "/intelligence", label: "Intelligence", icon: Brain },
  { to: "/screening", label: "Screening", icon: ScanSearch },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 right-4 z-50 md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-white/70"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={classNames(
          "fixed md:static z-40 top-[57px] left-0 h-[calc(100vh-57px)] md:top-0 md:h-full w-56 bg-[#0a0a0a] border-r border-white/10 pt-4 px-3 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  classNames(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  )
                }
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
