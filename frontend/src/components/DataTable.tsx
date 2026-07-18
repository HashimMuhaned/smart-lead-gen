import type { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
}

export function DataTable<T>({ columns, rows, keyField, onRowClick, sortKey, sortDir, onSort }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
      <table className="w-full text-left border-collapse min-w-[880px]">
        <thead>
          <tr className="border-b border-paper-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500 whitespace-nowrap",
                  col.sortable && "cursor-pointer select-none hover:text-ink-900-solid",
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyField(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-paper-100 last:border-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-paper-50"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3.5 text-[13px] text-ink-900-solid", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-14 text-center text-ink-500 text-[13px]">No results match your filters.</div>
      )}
    </div>
  );
}
