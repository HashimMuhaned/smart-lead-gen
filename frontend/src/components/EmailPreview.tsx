import { useState, useEffect } from "react";
import { RefreshCw, Pencil, Check, Sparkles, Save, Loader2 } from "lucide-react";

interface EmailPreviewProps {
  emailId?: string | null;
  subject: string;
  body: string;
  recipientName?: string;
  onSaveSuccess?: (updatedSubject: string, updatedBody: string) => void;
}

export function EmailPreview({
  emailId,
  subject,
  body,
  recipientName,
  onSaveSuccess,
}: EmailPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [draftSubject, setDraftSubject] = useState(subject);
  const [draftBody, setDraftBody] = useState(body);
  const [approved, setApproved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Keep state in sync if parent props change
  useEffect(() => {
    setDraftSubject(subject);
    setDraftBody(body);
  }, [subject, body]);

  function handleRegenerate() {
    setRegenerating(true);
    setApproved(false);
    setTimeout(() => setRegenerating(false), 900);
  }

  async function handleSave() {
    if (!emailId) {
      setSaveError("No email ID available to save updates.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch(
        `https://smart-lead-gen-backend.vercel.app/api/emails/update/${emailId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: draftSubject,
            body: draftBody,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update email");
      }

      setEditing(false);
      if (onSaveSuccess) {
        onSaveSuccess(draftSubject, draftBody);
      }
    } catch (err: any) {
      console.error("Error updating email:", err);
      setSaveError(err.message || "Failed to save email changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-card card-hairline overflow-hidden">
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
        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[12.5px]">
            {saveError}
          </div>
        )}

        <label className="text-[11.5px] font-medium text-ink-500 uppercase tracking-wide">
          Subject
        </label>
        {editing ? (
          <input
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            className="w-full mt-1.5 mb-4 px-3 py-2 rounded-lg border border-paper-200 text-[13.5px] font-medium outline-none focus:border-signal-400"
          />
        ) : (
          <p className="mt-1 mb-4 text-[14.5px] font-semibold text-ink-900-solid">
            {draftSubject}
          </p>
        )}

        <label className="text-[11.5px] font-medium text-ink-500 uppercase tracking-wide">
          Message
        </label>
        {editing ? (
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={10}
            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-paper-200 text-[13px] leading-relaxed outline-none focus:border-signal-400 resize-none"
          />
        ) : (
          <div
            className={
              regenerating ? "opacity-40 transition-opacity" : "transition-opacity"
            }
          >
            <p className="mt-1.5 text-[13px] text-ink-700 leading-relaxed whitespace-pre-line">
              {draftBody}
            </p>
          </div>
        )}
        {recipientName && !editing && (
          <p className="mt-3 text-[11.5px] text-ink-400">
            Personalized for {recipientName}
          </p>
        )}
      </div>

      <div className="px-5 py-4 border-t border-paper-100 flex flex-wrap gap-2">
        <button
          onClick={handleRegenerate}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-paper-200 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`}
          />
          Regenerate
        </button>

        {editing ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ink-900-solid text-white text-[12.5px] font-medium hover:bg-ink-800 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save changes
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-paper-200 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}

        <button
          onClick={() => setApproved(true)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg signal-gradient text-white text-[12.5px] font-semibold ml-auto disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          Approve
        </button>
      </div>
    </div>
  );
}