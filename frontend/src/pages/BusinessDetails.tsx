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
  UserCheck,
} from "lucide-react";

import { AppLayout } from "@/layout/AppLayout";
import { AnalysisCard } from "@/components/AnalysisCard";
import { EmailPreview } from "@/components/EmailPreview";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreRing } from "@/components/ScoreRing";
import { logoColorStyles } from "@/lib/utils";

import { useEffect, useState } from "react";
import type { Business } from "@/types";

export default function BusinessDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                {business.category} · {business?.contacts?.length || 0} Contact
                {business?.contacts?.length === 1 ? "" : "s"}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Details & Contacts */}
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

          {/* Key Contacts Component */}
          <div className="bg-white rounded-card card-hairline p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[14.5px] font-semibold text-ink-900-solid flex items-center gap-2">
                <Users className="w-4 h-4 text-signal-600" />
                Key Contacts ({business.contacts?.length || 0})
              </h3>
            </div>

            {!business.contacts || business.contacts.length === 0 ? (
              <p className="text-[13px] text-ink-400 italic">
                No individual contacts found.
              </p>
            ) : (
              <div className="space-y-3.5 divide-y divide-paper-100">
                {business.contacts.map((contact, idx) => (
                  <div
                    key={contact.id || idx}
                    className={`${idx > 0 ? "pt-3.5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-paper-100 text-ink-700 flex items-center justify-center font-semibold text-[11px] shrink-0">
                          {contact.firstName?.[0] ||
                            contact.lastName?.[0] ||
                            "C"}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-ink-900-solid leading-tight">
                            {contact.fullName}
                          </p>
                          {contact.jobTitle && (
                            <p className="inline-flex items-center gap-1 text-[11.5px] text-ink-500 mt-0.5">
                              <Briefcase className="w-3 h-3 text-ink-400 shrink-0" />
                              {contact.jobTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {contact.confidenceScore !== undefined && (
                        <span className="inline-flex items-center text-[10px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          {contact.confidenceScore}% match
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-1 pl-9 text-[12px]">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-2 text-ink-600 hover:text-signal-600 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-ink-400 italic">
                          <Mail className="w-3.5 h-3.5 text-ink-300 shrink-0" />
                          No email available
                        </div>
                      )}

                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-2 text-ink-600 hover:text-signal-600 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                          <span>{contact.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {/* Right Column - Email Preview */}
        <div className="lg:col-span-2">
          <EmailPreview
            subject={business.emailSubject}
            body={business.emailBody}
            recipientName={
              business.contacts?.[0]?.fullName || business.contactPerson
            }
          />
        </div>
      </div>
    </AppLayout>
  );
}
