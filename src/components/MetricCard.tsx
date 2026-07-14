import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: LucideIcon;
  accent?: "signal" | "mint" | "amber" | "coral";
}

const accentMap: Record<string, string> = {
  signal: "bg-signal-100 text-signal-600",
  mint: "bg-mint-100 text-mint-500",
  amber: "bg-amber-100 text-amber-500",
  coral: "bg-coral-100 text-coral-500",
};

export function MetricCard({ label, value, delta, deltaPositive = true, icon: Icon, accent = "signal" }: MetricCardProps) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] card-hairline p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-ink-500">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accentMap[accent])}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-display text-[26px] font-semibold text-ink-900-solid tracking-tight">{value}</span>
        {delta && (
          <span className={cn("text-[12px] font-semibold pb-1", deltaPositive ? "text-mint-500" : "text-coral-500")}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
