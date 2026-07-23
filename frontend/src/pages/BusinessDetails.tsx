import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe2,
  Phone,
  Mail,
  Share2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Users,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { AppLayout } from "@/layout/AppLayout";
import { AnalysisCard } from "@/components/AnalysisCard";
import { EmailPreview } from "@/components/EmailPreview";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreRing } from "@/components/ScoreRing";
import { logoColorStyles } from "@/lib/utils";

import { useEffect, useMemo, useState } from "react";
import type { Business } from "@/types";

const CONTACTS_PREVIEW_COUNT = 4;

export default function BusinessDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllContacts, setShowAllContacts] = useState(false);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch(
          `https://smart-lead-gen-backend.vercel.app/api/businesses/${id}/details`,
        );

        if (!response.ok) {
          throw new Error("Business not found");
        }

        const data = await response.json();
        setBusiness(data.business);
      } catch (err: any) {
        console.error("Failed fetching business:", err);
        setError(err.message || "Failed to load business");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchBusiness();
    }
  }, [id]);

  const contacts = business?.contacts || [];

  const visibleContacts = useMemo(() => {
    return showAllContacts
      ? contacts
      : contacts.slice(0, CONTACTS_PREVIEW_COUNT);
  }, [contacts, showAllContacts]);

  const hiddenCount = contacts.length - CONTACTS_PREVIEW_COUNT;

  if (loading) {
    return (
      <AppLayout title="Business Profile">
        <div className="bg-white rounded-card card-hairline p-8 text-center">
          Loading business profile...
        </div>
      </AppLayout>
    );
  }

  if (error || !business) {
    return (
      <AppLayout title="Business not found">
        <div className="bg-white rounded-card card-hairline p-8 text-center">
          <p className="text-[13.5px] text-ink-600 mb-4">
            {error || "We couldn't find that business."}
          </p>

          <Link to="/" className="text-signal-600 font-semibold text-[13px]">
            Back to Businesses
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Business Profile">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-900-solid mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Businesses
      </button>

      {/* Hero Header */}
      <div className="bg-white rounded-card card-hairline p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-[20px] font-semibold shrink-0 ${logoColorStyles[business.logoColor]}`}
            >
              {business.logoInitials}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display text-[20px] font-semibold text-ink-900-solid">
                  {business.name}
                </h2>

                <StatusBadge status={business.status} />
              </div>

              <p className="text-[13px] text-ink-500 mt-1">
                {business.category} · {contacts.length} Contact
                {contacts.length === 1 ? "" : "s"}
              </p>

              <p className="inline-flex items-center gap-1 text-[12.5px] text-ink-500 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {business.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <ScoreRing score={business.aiScore} size={56} />
              <p className="text-[11px] text-ink-500 mt-1">AI Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Contacts — full width, own row so long job titles have room */}
      <div className="bg-white rounded-card card-hairline p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[14.5px] font-semibold text-ink-900-solid flex items-center gap-2">
            <Users className="w-4 h-4 text-signal-600" />
            Key Contacts ({contacts.length})
          </h3>

          {contacts.length > CONTACTS_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllContacts((v) => !v)}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-signal-600 hover:text-signal-700 transition-colors"
            >
              {showAllContacts ? (
                <>
                  Show less
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Show all {contacts.length}
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {contacts.length === 0 ? (
          <p className="text-[13px] text-ink-400 italic">
            No individual contacts found.
          </p>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-4">
              {visibleContacts.map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="rounded-xl border border-paper-100 p-5 hover:border-paper-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-paper-100 text-ink-700 flex items-center justify-center font-semibold text-[13px] shrink-0">
                        {contact.firstName?.[0] || contact.lastName?.[0] || "C"}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[14.5px] font-medium text-ink-900-solid leading-tight">
                          {contact.fullName}
                        </p>

                        {contact.jobTitle && (
                          <p className="flex items-start gap-1.5 text-[13px] text-ink-500 mt-1.5 leading-snug">
                            <Briefcase className="w-3.5 h-3.5 text-ink-400 shrink-0 mt-[2px]" />
                            <span className="break-words whitespace-normal">
                              {contact.jobTitle}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-paper-100 space-y-2 text-[13px]">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-ink-600 hover:text-signal-600 transition-colors"
                      >
                        <Mail className="w-4 h-4 text-ink-400 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-ink-400 italic">
                        <Mail className="w-4 h-4 text-ink-300 shrink-0" />
                        No email available
                      </div>
                    )}

                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-ink-600 hover:text-signal-600 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-ink-400 shrink-0" />
                        <span>{contact.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!showAllContacts && hiddenCount > 0 && (
              <button
                onClick={() => setShowAllContacts(true)}
                className="mt-3 w-full text-center text-[12.5px] font-medium text-ink-500 hover:text-signal-600 py-2 rounded-lg border border-dashed border-paper-200 hover:border-signal-200 transition-colors"
              >
                + {hiddenCount} more contact{hiddenCount === 1 ? "" : "s"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Details + Analysis + Email Preview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          {/* Business Info */}
          <div className="bg-white rounded-card card-hairline p-5">
            <h3 className="font-display text-[14.5px] font-semibold text-ink-900-solid mb-4">
              Business Information
            </h3>

            <ul className="space-y-3 text-[13px]">
              <li className="flex items-center gap-2.5 text-ink-700">
                <Globe2 className="w-4 h-4 text-ink-400 shrink-0" />
                {business.website ? (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline truncate"
                  >
                    {business.website}
                  </a>
                ) : (
                  <span className="text-ink-400">No website found</span>
                )}
              </li>

              <li className="flex items-center gap-2.5 text-ink-700">
                <Phone className="w-4 h-4 text-ink-400 shrink-0" />
                {business.phone}
              </li>

              <li className="flex items-center gap-2.5 text-ink-700">
                <Share2 className="w-4 h-4 text-ink-400 shrink-0" />
                Instagram, Facebook
              </li>
            </ul>

            <div className="mt-4 pt-4 border-t border-paper-100 grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <p className="text-ink-500">Rating</p>
                <p className="font-semibold text-ink-900-solid">
                  {business.rating} ({business.reviews})
                </p>
              </div>

              <div>
                <p className="text-ink-500">Team size</p>
                <p className="font-semibold text-ink-900-solid">
                  {business.employeeCount}
                </p>
              </div>

              <div>
                <p className="text-ink-500">Source</p>
                <p className="font-semibold text-ink-900-solid">
                  {business.source}
                </p>
              </div>

              <div>
                <p className="text-ink-500">Added</p>
                <p className="font-semibold text-ink-900-solid">
                  {business.addedAt}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Cards */}
          <AnalysisCard
            title="Detected Problems"
            icon={AlertTriangle}
            items={business.detectedProblems}
            variant="problem"
          />

          <AnalysisCard
            title="Recommended Services"
            icon={Sparkles}
            items={business.recommendedServices}
            variant="recommendation"
          />
        </div>

        {/* Email Preview */}
        <div className="lg:col-span-2">
          <EmailPreview
            subject={business.emailSubject}
            body={business.emailBody}
            recipientName={contacts?.[0]?.fullName || business.contactPerson}
          />
        </div>
      </div>
    </AppLayout>
  );
}
