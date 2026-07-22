import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Globe2, SlidersHorizontal } from "lucide-react";
import { AppLayout } from "@/layout/AppLayout";
import { DataTable, type Column } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreRing } from "@/components/ScoreRing";
import type { Business } from "@/types";
import { logoColorStyles } from "@/lib/utils";

const PAGE_SIZE = 8;

const categories = [
  "All",
  "Dental",
  "Restaurants",
  "Car Rentals",
  "Real Estate",
  "Medical Clinics",
];

const statuses = [
  "All",
  "Hot Lead",
  "Warm Lead",
  "Cold Lead",
  "Contacted",
  "Replied",
  "Booked",
];

const API_BASE_URL = "https://smart-lead-gen-backend.vercel.app";

export default function Businesses() {
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("aiScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Fetch businesses from backend
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/businesses`);

        if (!response.ok) {
          throw new Error("Failed to fetch businesses");
        }

        const data = await response.json();

        setBusinesses(data.businesses || []);
      } catch (err: any) {
        console.error("Fetch businesses error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, []);

  const filtered = useMemo(() => {
    let rows = businesses.filter((b) => {
      const matchesQuery =
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.location.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = category === "All" || b.category === category;

      const matchesStatus = status === "All" || b.status === status;

      return matchesQuery && matchesCategory && matchesStatus;
    });

    rows = [...rows].sort((a, b) => {
      const av = a[sortKey as keyof Business];
      const bv = b[sortKey as keyof Business];

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return rows;
  }, [businesses, query, category, status, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const columns: Column<Business>[] = [
    {
      key: "name",
      header: "Business Name",
      sortable: true,

      render: (r) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11.5px] font-semibold shrink-0 ${logoColorStyles[r.logoColor]}`}
          >
            {r.logoInitials}
          </div>

          <div>
            <p className="font-medium">{r.name}</p>

            <p className="text-[11.5px] text-ink-500">{r.contactPerson}</p>
          </div>
        </div>
      ),
    },

    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (r) => r.category,
    },

    {
      key: "location",
      header: "Location",
      render: (r) => r.location,
    },

    {
      key: "website",
      header: "Website",

      render: (r) =>
        r.website ? (
          <span className="inline-flex items-center gap-1.5 text-signal-600">
            <Globe2 className="w-3.5 h-3.5" />
            {r.website}
          </span>
        ) : (
          <span className="text-ink-400">No website</span>
        ),
    },

    {
      key: "rating",
      header: "Rating",
      sortable: true,

      render: (r) => (
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />

          {r.rating}

          <span className="text-ink-400 ml-1">({r.reviews})</span>
        </span>
      ),
    },

    {
      key: "email",
      header: "Email",

      render: (r) => r.email ?? <span className="text-ink-400">—</span>,
    },

    {
      key: "aiScore",
      header: "AI Score",
      sortable: true,

      render: (r) => <ScoreRing score={r.aiScore} size={34} />,
    },

    {
      key: "status",
      header: "Status",
      sortable: true,

      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  if (loading) {
    return (
      <AppLayout title="Businesses">
        <div className="p-5">Loading businesses...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Businesses">
        <div className="p-5 text-red-500">{error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Businesses"
      subtitle={`${filtered.length} businesses in your CRM`}
    >
      <div className="bg-white rounded-card card-hairline p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-paper-50 border border-paper-200 rounded-full px-3.5 py-2 flex-1 min-w-50">
            <Search className="w-3.75 h-3.75 text-ink-400" />

            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or location..."
              className="bg-transparent text-[13px] outline-none w-full placeholder:text-ink-400"
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-full border border-paper-200 text-[12.5px] font-medium bg-white"
          >
            {categories.map((c) => (
              <option key={c}>{c === "All" ? "All categories" : c}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-full border border-paper-200 text-[12.5px] font-medium bg-white"
          >
            {statuses.map((s) => (
              <option key={s}>{s === "All" ? "All statuses" : s}</option>
            ))}
          </select>

          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-paper-200 text-[12.5px] font-medium text-ink-600 hover:bg-paper-50">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            More filters
          </button>
        </div>

        <DataTable
          columns={columns}
          rows={pageRows}
          keyField={(r) => r.id}
          onRowClick={(r) => navigate(`/businesses/${r.id}`)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
        />
      </div>
    </AppLayout>
  );
}
