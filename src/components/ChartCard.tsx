import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, action, children, className }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-[var(--radius-card)] card-hairline p-5 lg:p-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-ink-900-solid">{title}</h3>
          {subtitle && <p className="text-[12px] text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
