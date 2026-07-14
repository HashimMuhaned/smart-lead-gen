import { NavLink } from "react-router-dom";
import { LayoutGrid, Radar, Building2, Mail, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/discovery", label: "Discover", icon: Radar },
  { to: "/businesses", label: "Leads", icon: Building2 },
  { to: "/campaigns", label: "Campaigns", icon: Mail },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-ink-950 border-t border-white/10 flex justify-between px-2 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10.5px] font-medium flex-1",
                isActive ? "text-white" : "text-ink-400"
              )
            }
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
