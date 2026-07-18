import { useNavigate } from "react-router-dom";
import { BrainCircuit, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { AppLayout } from "@/layout/AppLayout";
import { ScoreRing } from "@/components/ScoreRing";
import { logoColorStyles } from "@/lib/utils";
import { businesses } from "@/data/businesses";

export default function AIAnalysis() {
  const navigate = useNavigate();
  const analyzed = businesses.slice(0, 9);
  const avgScore = Math.round(businesses.reduce((s, b) => s + b.aiScore, 0) / businesses.length);
  const commonProblems = [
    "No online booking system",
    "No WhatsApp integration",
    "No chatbot for after-hours enquiries",
    "Slow mobile experience",
  ];

  return (
    <AppLayout title="AI Analysis" subtitle="Website audits and opportunity scoring for every lead">
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-[var(--radius-card)] card-hairline p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-signal-100 text-signal-600 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display text-[22px] font-semibold text-ink-900-solid">1,230</p>
            <p className="text-[12.5px] text-ink-500">Websites analyzed</p>
          </div>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] card-hairline p-5 flex items-center gap-4">
          <ScoreRing score={avgScore} size={44} />
          <div>
            <p className="text-[13px] font-semibold text-ink-900-solid">Average AI Score</p>
            <p className="text-[12.5px] text-ink-500">Across all analyzed leads</p>
          </div>
        </div>
        <div className="bg-white rounded-[var(--radius-card)] card-hairline p-5">
          <p className="text-[13px] font-semibold text-ink-900-solid mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-coral-500" /> Most common problems
          </p>
          <div className="flex flex-wrap gap-1.5">
            {commonProblems.map((p) => (
              <span key={p} className="text-[11px] px-2 py-1 rounded-full bg-coral-100 text-coral-500 font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-4">Recent Analyses</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyzed.map((b) => (
          <button
            key={b.id}
            onClick={() => navigate(`/businesses/${b.id}`)}
            className="text-left bg-white rounded-2xl card-hairline p-4 hover:border-signal-400/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11.5px] font-semibold shrink-0 ${logoColorStyles[b.logoColor]}`}>
                {b.logoInitials}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-[13px] text-ink-900-solid truncate">{b.name}</p>
                <p className="text-[11.5px] text-ink-500">{b.category}</p>
              </div>
              <ScoreRing score={b.aiScore} size={32} />
            </div>
            <div className="space-y-1.5 mb-3">
              {b.detectedProblems.slice(0, 2).map((p) => (
                <p key={p} className="text-[12px] text-ink-600 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-coral-500 mt-1.5 shrink-0" /> {p}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-between text-[12px] font-medium text-signal-600 pt-2 border-t border-paper-100">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {b.recommendedServices.length} services recommended
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
