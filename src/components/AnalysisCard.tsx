import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  title: string;
  icon: LucideIcon;
  items: string[];
  variant: "problem" | "recommendation";
}

export function AnalysisCard({ title, icon: Icon, items, variant }: AnalysisCardProps) {
  const isProblem = variant === "problem";
  return (
    <div className="bg-white rounded-[var(--radius-card)] card-hairline p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isProblem ? "bg-coral-100 text-coral-500" : "bg-mint-100 text-mint-500"
          )}
        >
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <h3 className="font-display text-[14.5px] font-semibold text-ink-900-solid">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[13px] text-ink-700 leading-relaxed">
            <span
              className={cn(
                "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                isProblem ? "bg-coral-500" : "bg-mint-500"
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
