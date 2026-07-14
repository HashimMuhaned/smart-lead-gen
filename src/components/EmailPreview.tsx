import { useState } from "react";
import { RefreshCw, Pencil, Check, Sparkles } from "lucide-react";

interface EmailPreviewProps {
  subject: string;
  body: string;
  recipientName?: string;
}

export function EmailPreview({ subject, body, recipientName }: EmailPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [draftSubject, setDraftSubject] = useState(subject);
  const [draftBody, setDraftBody] = useState(body);
  const [approved, setApproved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  function handleRegenerate() {
    setRegenerating(true);
    setApproved(false);
    setTimeout(() => setRegenerating(false), 900);
  }

  return (
    <div className="bg-white rounded-[var(--radius-card)] card-hairline overflow-hidden">
      <div className="px-5 py-4 border-b border-paper-100 flex items-center justify-between mesh-glow">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-signal-500" />
          <span className="text-[12px] font-semibold text-signal-600 uppercase tracking-wide">
            AI-Generated Email
          </span>
        </div>
        {approved && (
          <span className="text-[11.5px] font-semibold text-mint-500 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Approved
          </span>
        )}
      </div>

      <div className="p-5">
        <label className="text-[11.5px] font-medium text-ink-500 uppercase tracking-wide">Subject</label>
        {editing ? (
          <input
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            className="w-full mt-1.5 mb-4 px-3 py-2 rounded-lg border border-paper-200 text-[13.5px] font-medium outline-none focus:border-signal-400"
          />
        ) : (
          <p className="mt-1 mb-4 text-[14.5px] font-semibold text-ink-900-solid">{draftSubject}</p>
        )}

        <label className="text-[11.5px] font-medium text-ink-500 uppercase tracking-wide">Message</label>
        {editing ? (
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={10}
            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-paper-200 text-[13px] leading-relaxed outline-none focus:border-signal-400 resize-none"
          />
        ) : (
          <div className={regenerating ? "opacity-40 transition-opacity" : "transition-opacity"}>
            <p className="mt-1.5 text-[13px] text-ink-700 leading-relaxed whitespace-pre-line">
              {draftBody}
            </p>
          </div>
        )}
        {recipientName && !editing && (
          <p className="mt-3 text-[11.5px] text-ink-400">Personalized for {recipientName}</p>
        )}
      </div>

      <div className="px-5 py-4 border-t border-paper-100 flex flex-wrap gap-2">
        <button
          onClick={handleRegenerate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-paper-200 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
          Regenerate
        </button>
        <button
          onClick={() => setEditing((e) => !e)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-paper-200 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50"
        >
          <Pencil className="w-3.5 h-3.5" />
          {editing ? "Done editing" : "Edit"}
        </button>
        <button
          onClick={() => setApproved(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg signal-gradient text-white text-[12.5px] font-semibold ml-auto"
        >
          <Check className="w-3.5 h-3.5" />
          Approve
        </button>
      </div>
    </div>
  );
}
