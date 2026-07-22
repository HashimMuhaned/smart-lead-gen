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

          <Link
            to="/"
            className="text-signal-600 font-semibold text-[13px]"
          >
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
                {business.category} · {business.contactPerson}
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
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-card card-hairline p-5">
            <h3 className="font-display text-[14.5px] font-semibold text-ink-900-solid mb-4">
              Business Information
            </h3>

            <ul className="space-y-3 text-[13px]">
              <li className="flex items-center gap-2.5 text-ink-700">
                <Globe2 className="w-4 h-4 text-ink-400" />

                {business.website ?? (
                  <span className="text-ink-400">No website found</span>
                )}
              </li>

              <li className="flex items-center gap-2.5 text-ink-700">
                <Phone className="w-4 h-4 text-ink-400" />

                {business.phone}
              </li>

              <li className="flex items-center gap-2.5 text-ink-700">
                <Mail className="w-4 h-4 text-ink-400" />

                {business.email ?? (
                  <span className="text-ink-400">No email found</span>
                )}
              </li>

              <li className="flex items-center gap-2.5 text-ink-700">
                <Share2 className="w-4 h-4 text-ink-400" />
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

        <div className="lg:col-span-2">
          <EmailPreview
            subject={business.emailSubject}
            body={business.emailBody}
            recipientName={business.contactPerson}
          />
        </div>
      </div>
    </AppLayout>
  );
}
