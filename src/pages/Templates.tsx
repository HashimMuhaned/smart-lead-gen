import { Plus, Copy, Pencil, TrendingUp } from "lucide-react";
import { AppLayout } from "@/layout/AppLayout";
import { emailTemplates } from "@/data/mock";

export default function Templates() {
  return (
    <AppLayout title="Templates" subtitle="Reusable email templates by industry and use case">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[12.5px] text-ink-500">{emailTemplates.length} templates</p>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl signal-gradient text-white text-[12.5px] font-semibold">
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {emailTemplates.map((t) => (
          <div key={t.id} className="bg-white rounded-[var(--radius-card)] card-hairline p-5 flex flex-col">
            <div className="mb-3">
              <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-signal-100 text-signal-600">
                {t.industry}
              </span>
            </div>
            <h3 className="font-display text-[14.5px] font-semibold text-ink-900-solid">{t.name}</h3>
            <p className="text-[12px] text-ink-500 mt-1 mb-3">{t.useCase}</p>

            <div className="bg-paper-50 rounded-xl p-3 mb-4">
              <p className="text-[12px] font-semibold text-ink-900-solid mb-1 truncate">{t.subject}</p>
              <p className="text-[11.5px] text-ink-500 leading-relaxed line-clamp-3">{t.preview}</p>
            </div>

            <div className="flex items-center justify-between text-[12px] text-ink-500 mb-4">
              <span>Used {t.timesUsed} times</span>
              <span className="inline-flex items-center gap-1 text-mint-500 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> {t.replyRate}% replies
              </span>
            </div>

            <div className="flex gap-2 mt-auto pt-3 border-t border-paper-100">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-paper-200 text-[12px] font-medium text-ink-700 hover:bg-paper-50">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-paper-200 text-[12px] font-medium text-ink-700 hover:bg-paper-50">
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
