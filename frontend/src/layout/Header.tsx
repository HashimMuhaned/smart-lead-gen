import { Search, Bell, ChevronDown } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-paper-50/85 backdrop-blur-sm border-b border-paper-200">
      <div className="h-16 px-5 lg:px-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[19px] font-semibold text-ink-900-solid tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-[12.5px] text-ink-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white border border-paper-200 rounded-full px-3.5 py-2 w-64">
            <Search className="w-[15px] h-[15px] text-ink-400" strokeWidth={2} />
            <input
              placeholder="Search leads, campaigns..."
              className="bg-transparent text-[13px] outline-none w-full placeholder:text-ink-400"
            />
          </div>

          <button className="relative w-9 h-9 rounded-full bg-white border border-paper-200 flex items-center justify-center">
            <Bell className="w-[16px] h-[16px] text-ink-600" strokeWidth={2} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-coral-500" />
          </button>

          <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white transition-colors">
            <div className="w-8 h-8 rounded-full signal-gradient flex items-center justify-center text-white text-[12px] font-semibold">
              YN
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-500 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
