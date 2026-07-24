import { useState, useEffect } from "react";
import {
  RefreshCw,
  Pencil,
  Check,
  Sparkles,
  Save,
  Loader2,
  X,
} from "lucide-react";

interface EmailPreviewProps {
  emailId?: string | null;
  subject: string;
  body: string;
  recipientName?: string;
  onSaveSuccess?: (updatedSubject: string, updatedBody: string) => void;
}

interface StoredDraft {
  draftSubject: string;
  draftBody: string;
  originalSubject: string;
  originalBody: string;
}

function getStorageKey(emailId?: string | null) {
  return emailId ? `email-draft-${emailId}` : null;
}

function readDraft(emailId?: string | null): StoredDraft | null {
  const key = getStorageKey(emailId);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft;
  } catch (e) {
    console.error("Failed to read email draft from localStorage:", e);
    return null;
  }
}

function writeDraft(emailId: string | null | undefined, draft: StoredDraft) {
  const key = getStorageKey(emailId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (e) {
    console.error("Failed to save email draft to localStorage:", e);
  }
}

function clearDraft(emailId?: string | null) {
  const key = getStorageKey(emailId);
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Failed to clear email draft from localStorage:", e);
  }
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
  // Snapshot of the values to revert to if the user cancels editing.
  const [originalSubject, setOriginalSubject] = useState(subject);
  const [originalBody, setOriginalBody] = useState(body);
  const [approved, setApproved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Keep state in sync with parent props, but restore an in-progress draft
  // from localStorage first if one exists (e.g. after a refresh).
  useEffect(() => {
    const saved = readDraft(emailId);
    if (saved) {
      setDraftSubject(saved.draftSubject);
      setDraftBody(saved.draftBody);
      setOriginalSubject(saved.originalSubject);
      setOriginalBody(saved.originalBody);
      setEditing(true);
      return;
    }
    setDraftSubject(subject);
    setDraftBody(body);
    setOriginalSubject(subject);
    setOriginalBody(body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, body, emailId]);

  // Persist the draft to localStorage while editing so it can be restored
  // on cancel (or after a refresh). Cleared on cancel/save.
  useEffect(() => {
    if (!editing) return;
    writeDraft(emailId, {
      draftSubject,
      draftBody,
      originalSubject,
      originalBody,
    });
  }, [
    editing,
    draftSubject,
    draftBody,
    originalSubject,
    originalBody,
    emailId,
  ]);

  function handleStartEdit() {
    // Lock in the "original" snapshot at the moment editing begins.
    setOriginalSubject(draftSubject);
    setOriginalBody(draftBody);
    setEditing(true);
  }

  function handleCancel() {
    setDraftSubject(originalSubject);
    setDraftBody(originalBody);
    setEditing(false);
    setError("");
    clearDraft(emailId);
  }

  async function handleRegenerate() {
    if (!emailId) {
      setError("No email ID available to regenerate.");
      return;
    }

    setRegenerating(true);
    setError("");
    setApproved(false);

    try {
      const response = await fetch(
        `https://smart-lead-gen-backend.vercel.app/api/emails/regenerate/${emailId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const result = await response.json();

      console.log(response.status);
      console.log(result);

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to regenerate email",
        );
      }

      // Extract new subject & body depending on your controller response shape
      const updatedSubject =
        result.data?.subject || result.email?.subject || draftSubject;
      const updatedBody = result.data?.body || result.email?.body || draftBody;

      setDraftSubject(updatedSubject);
      setDraftBody(updatedBody);

      onSaveSuccess?.(updatedSubject, updatedBody);
    } catch (err: any) {
      console.error("Error regenerating email:", err);
      setError(err.message || "Failed to regenerate email.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSave() {
    if (!emailId) {
      setError("No email ID available to save updates.");
      return;
    }

    setSaving(true);
    setError("");

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
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update email");
      }

      setEditing(false);
      setOriginalSubject(draftSubject);
      setOriginalBody(draftBody);
      clearDraft(emailId);
      if (onSaveSuccess) {
        onSaveSuccess(draftSubject, draftBody);
      }
    } catch (err: any) {
      console.error("Error updating email:", err);
      setError(err.message || "Failed to save email changes.");
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
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[12.5px]">
            {error}
          </div>
        )}

        <label className="text-[11.5px] font-medium text-ink-500 uppercase tracking-wide">
          Subject
        </label>
        {editing ? (
          <input
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            disabled={regenerating || saving}
            className="w-full mt-1.5 mb-4 px-3 py-2 rounded-lg border border-paper-200 text-[13.5px] font-medium outline-none focus:border-signal-400 disabled:opacity-50"
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
            disabled={regenerating || saving}
            rows={10}
            className="w-full mt-1.5 px-3 py-2.5 rounded-lg border border-paper-200 text-[13px] leading-relaxed outline-none focus:border-signal-400 resize-none disabled:opacity-50"
          />
        ) : (
          <div
            className={
              regenerating
                ? "opacity-40 transition-opacity"
                : "transition-opacity"
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
          disabled={regenerating || saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[12.5px] font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`}
          />
          {regenerating ? "Regenerating..." : "Regenerate"}
        </button>

        {editing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={regenerating || saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 text-[12.5px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={regenerating || saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-[12.5px] font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save changes
            </button>
          </>
        ) : (
          <button
            onClick={handleStartEdit}
            disabled={regenerating || saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[12.5px] font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}

        <button
          onClick={() => setApproved(true)}
          disabled={regenerating || saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-600 text-white text-[12.5px] font-semibold ml-auto hover:bg-green-700 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          Approve
        </button>
      </div>
    </div>
  );
}
