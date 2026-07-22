import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Radar,
  Building2,
  BrainCircuit,
  Mail,
  FileText,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Businesses", icon: LayoutGrid },
  { to: "/discovery", label: "Lead Discovery", icon: Radar },
  // { to: "/businesses", label: "Businesses", icon: Building2 },
  // { to: "/analysis", label: "AI Analysis", icon: BrainCircuit },
  // { to: "/campaigns", label: "Email Campaigns", icon: Mail },
  // { to: "/templates", label: "Templates", icon: FileText },
  // { to: "/analytics", label: "Analytics", icon: BarChart3 },
  // { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 flex-col shrink-0 bg-ink-950 text-white h-screen sticky top-0">
      <div className="px-6 h-16 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl signal-gradient flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
        </div>
        <span className="font-display font-semibold text-[17px] tracking-tight">LeadAI</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-ink-400">
          Workspace
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-ink-400 hover:text-white hover:bg-white/5"
                )
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 m-3 rounded-2xl bg-white/5 border border-white/10">
        <p className="text-[12.5px] font-semibold text-white">Upgrade to Pro</p>
        <p className="text-[12px] text-ink-400 mt-1 leading-relaxed">
          Unlock unlimited lead searches and AI email generations.
        </p>
        <button className="mt-3 w-full py-2 rounded-lg signal-gradient text-white text-[12.5px] font-semibold">
          Upgrade
        </button>
      </div>
    </aside>
  );
}
