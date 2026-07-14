import { Clock, MapPin } from "lucide-react";
import type { SearchRun } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function LeadCard({ run }: { run: SearchRun }) {
  return (
    <div className="bg-white rounded-2xl card-hairline p-4 flex items-center justify-between gap-4 hover:border-signal-400/40 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-[13.5px] text-ink-900-solid">{run.industry}</h4>
          <StatusBadge status={run.status} />
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[12px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {run.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {run.startedAt}
          </span>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {run.filters.map((f) => (
            <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-paper-100 text-ink-500">
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display text-[20px] font-semibold text-ink-900-solid">{run.leadsFound}</p>
        <p className="text-[11px] text-ink-500">leads found</p>
      </div>
    </div>
  );
}
