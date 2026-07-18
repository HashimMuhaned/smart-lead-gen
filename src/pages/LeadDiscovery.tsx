import { useState, useEffect } from "react";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import { AppLayout } from "@/layout/AppLayout";
import { LeadCard } from "@/components/LeadCard";
import type { SearchRun } from "@/types";

const industries = [
  "Dental Clinics",
  "Restaurants",
  "Car Rentals",
  "Real Estate",
  "Medical Clinics",
];

const filterOptions = [
  { id: "hasWebsite", label: "Has Website" },
  { id: "hasEmail", label: "Has Email" },
  { id: "googleRating", label: "Google Rating ≥ 4.0" },
  { id: "reviewCount", label: "Review Count ≥ 50" },
  { id: "companySize", label: "Company Size: 10-50" },
];

export default function LeadDiscovery() {
  const [industry, setIndustry] = useState(industries[0]);
  const [location, setLocation] = useState("Dubai, UAE");
  const [numLeads, setNumLeads] = useState(20); // Default to a smaller test limit
  const [activeFilters, setActiveFilters] = useState<string[]>(["hasWebsite"]);
  const [searching, setSearching] = useState(false);
  const [justSearched, setJustSearched] = useState(false);
  
  // Replace static mock runs with state
  const [searchRuns, setSearchRuns] = useState<SearchRun[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 1. Fetch campaigns from backend
  async function fetchCampaigns() {
    try {
      const response = await fetch("https://smart-lead-gen-backend.vercel.app/api/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns history");
      const data = await response.json();
      if (data.success) {
        setSearchRuns(data.campaigns);
      }
    } catch (err) {
      console.error("Error fetching campaigns history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // 2. Poll the API for status updates every 5 seconds
  useEffect(() => {
    fetchCampaigns(); // Run initially on load

    const interval = setInterval(() => {
      fetchCampaigns();
    }, 5000); // Polling window of 5 seconds

    return () => clearInterval(interval);
  }, []);

  function toggleFilter(id: string) {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  async function startSearch() {
    try {
      setSearching(true);
      setJustSearched(false);

      const response = await fetch(
        "https://smart-lead-gen-backend.vercel.app/api/campaigns",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: "c2d0db33-6e49-492c-86c2-136d3d1478a6",
            campaignName: `${industry} ${location}`,
            industry,
            location,
            maxLeads: numLeads,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setJustSearched(true);
      // Instantly refresh list so the newly queued job appears immediately
      fetchCampaigns(); 
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  return (
    <AppLayout
      title="Lead Discovery"
      subtitle="Configure a search to find new local businesses"
    >
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-card card-hairline p-6">
          <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-5">
            New Search
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[12.5px] font-medium text-ink-600">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-lg border border-paper-200 text-[13.5px] outline-none focus:border-signal-400 bg-white"
              >
                {industries.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-ink-600">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-lg border border-paper-200 text-[13.5px] outline-none focus:border-signal-400"
              />
            </div>
            <div>
              <label className="text-[12.5px] font-medium text-ink-600">
                Number of leads
              </label>
              <input
                type="number"
                value={numLeads}
                onChange={(e) => setNumLeads(Number(e.target.value))}
                className="w-full mt-1.5 px-3.5 py-2.5 rounded-lg border border-paper-200 text-[13.5px] outline-none focus:border-signal-400"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="text-[12.5px] font-medium text-ink-600 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </label>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {filterOptions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggleFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors ${
                    activeFilters.includes(f.id)
                      ? "bg-signal-500 border-signal-500 text-white"
                      : "border-paper-200 text-ink-600 hover:border-signal-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSearch}
            disabled={searching}
            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl signal-gradient text-white text-[13.5px] font-semibold disabled:opacity-70"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Searching for
                leads...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" /> Start Lead Search
              </>
            )}
          </button>

          {justSearched && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-mint-100 text-mint-500 text-[12.5px] font-medium">
              Search queued — "{industry}" in {location}. New leads will appear
              below shortly.
            </div>
          )}
        </div>

        <div className="bg-white rounded-card card-hairline p-6">
          <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-1">
            How discovery works
          </h3>
          <p className="text-[12.5px] text-ink-500 leading-relaxed mb-4">
            LeadAI scans map listings and business directories, filters by your
            criteria, then hands each result to AI Analysis for a website audit.
          </p>
          <ol className="space-y-3">
            {[
              "Configure industry, location & filters",
              "Search runs across Google Maps, Apollo & manual lists",
              "Results appear in Businesses for AI analysis",
              "Enrich and identify target contact cards automatically",
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 text-[12.5px] text-ink-700"
              >
                <span className="w-5 h-5 rounded-full bg-signal-100 text-signal-600 text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-4">
          Previous Searches
        </h3>
        
        {loadingHistory ? (
          <div className="flex items-center gap-2 text-ink-500 text-[13.5px]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading run history...
          </div>
        ) : searchRuns.length === 0 ? (
          <div className="text-ink-500 text-[13.5px] bg-white rounded-card card-hairline p-6 text-center">
            No searches completed yet. Start your first search above!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {searchRuns.map((run) => (
              <LeadCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}