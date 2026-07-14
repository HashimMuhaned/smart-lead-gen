import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export function Pagination({ page, totalPages, onChange, totalItems, pageSize }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-1 pt-4">
      <p className="text-[12.5px] text-ink-500">
        Showing <span className="font-medium text-ink-900-solid">{start}-{end}</span> of{" "}
        <span className="font-medium text-ink-900-solid">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg border border-paper-200 flex items-center justify-center disabled:opacity-40 hover:bg-paper-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => Math.abs(p - page) <= 1 || p === 1 || p === totalPages)
          .reduce<number[]>((acc, p) => {
            if (acc.length && p - acc[acc.length - 1] > 1) acc.push(-1);
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === -1 ? (
              <span key={`gap-${i}`} className="px-1 text-ink-400 text-[12.5px]">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={cn(
                  "w-8 h-8 rounded-lg text-[12.5px] font-medium",
                  p === page ? "bg-ink-900-solid text-white" : "hover:bg-paper-100 text-ink-600"
                )}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg border border-paper-200 flex items-center justify-center disabled:opacity-40 hover:bg-paper-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
