import { cn } from "@/lib/utils";
import { statusStyles } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap",
        statusStyles[status] ?? "bg-paper-200 text-ink-500"
      )}
    >
      {status}
    </span>
  );
}
