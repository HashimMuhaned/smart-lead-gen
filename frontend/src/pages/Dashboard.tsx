import { Building2, Globe, MailPlus, Send, MessageSquareReply, CalendarCheck } from "lucide-react";
import { AppLayout } from "@/layout/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreRing } from "@/components/ScoreRing";
import { campaigns } from "@/data/mock";
import { businesses } from "@/data/businesses";
import { outreachPerformance, leadQualityTrend } from "@/data/mock";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useNavigate } from "react-router-dom";

const metrics = [
  { label: "Total Businesses Found", value: "2,540", delta: "+12.4%", icon: Building2, accent: "signal" as const },
  { label: "Analyzed Websites", value: "1,230", delta: "+8.1%", icon: Globe, accent: "mint" as const },
  { label: "Emails Generated", value: "850", delta: "+15.0%", icon: MailPlus, accent: "amber" as const },
  { label: "Emails Sent", value: "620", delta: "+6.7%", icon: Send, accent: "signal" as const },
  { label: "Replies", value: "42", delta: "+2 today", icon: MessageSquareReply, accent: "mint" as const },
  { label: "Meetings Booked", value: "8", delta: "+1 today", icon: CalendarCheck, accent: "coral" as const },
];

const campaignColumns: Column<(typeof campaigns)[number]>[] = [
  { key: "name", header: "Campaign", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "industry", header: "Industry", render: (r) => r.industry },
  { key: "sent", header: "Sent", render: (r) => r.sent },
  {
    key: "opened",
    header: "Opened",
    render: (r) => `${r.sent ? Math.round((r.opened / r.sent) * 100) : 0}%`,
  },
  { key: "replies", header: "Replies", render: (r) => r.replies },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

const leadColumns: Column<(typeof businesses)[number]>[] = [
  {
    key: "name",
    header: "Business",
    render: (r) => (
      <div>
        <p className="font-medium">{r.name}</p>
        <p className="text-[11.5px] text-ink-500">{r.category} · {r.location}</p>
      </div>
    ),
  },
  { key: "score", header: "AI Score", render: (r) => <ScoreRing score={r.aiScore} size={34} /> },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
];

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <AppLayout title="Dashboard" subtitle="Your outreach pipeline at a glance">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mt-6">
        <ChartCard title="Outreach Performance" subtitle="Last 7 days" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={outreachPerformance}>
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F5BFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4F5BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EEF0F7" />
              <XAxis dataKey="label" tick={{ fontSize: 11.5, fill: "#7C859C" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11.5, fill: "#7C859C" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #E2E5F0", fontSize: 12.5 }}
              />
              <Area type="monotone" dataKey="sent" stroke="#4F5BFF" strokeWidth={2.5} fill="url(#sentGrad)" name="Sent" />
              <Area type="monotone" dataKey="opened" stroke="#17B897" strokeWidth={2.5} fill="transparent" name="Opened" />
              <Area type="monotone" dataKey="replies" stroke="#F2A93B" strokeWidth={2.5} fill="transparent" name="Replies" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Quality Trend" subtitle="Hot vs warm vs cold" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={leadQualityTrend}>
              <CartesianGrid vertical={false} stroke="#EEF0F7" />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "#7C859C" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11.5, fill: "#7C859C" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E5F0", fontSize: 12.5 }} />
              <Bar dataKey="hot" stackId="a" fill="#F2596B" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warm" stackId="a" fill="#F2A93B" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cold" stackId="a" fill="#CBD0E0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mt-5">
        <ChartCard
          title="Recent Campaigns"
          subtitle="Your active and recent outreach"
          className="lg:col-span-3"
          action={
            <button onClick={() => navigate("/campaigns")} className="text-[12.5px] font-semibold text-signal-600 hover:underline">
              View all
            </button>
          }
        >
          <DataTable columns={campaignColumns} rows={campaigns.slice(0, 5)} keyField={(r) => r.id} />
        </ChartCard>

        <ChartCard
          title="Recent Leads"
          subtitle="Newest discovered businesses"
          className="lg:col-span-2"
          action={
            <button onClick={() => navigate("/businesses")} className="text-[12.5px] font-semibold text-signal-600 hover:underline">
              View all
            </button>
          }
        >
          <DataTable
            columns={leadColumns}
            rows={businesses.slice(0, 5)}
            keyField={(r) => r.id}
            onRowClick={(r) => navigate(`/businesses/${r.id}`)}
          />
        </ChartCard>
      </div>
    </AppLayout>
  );
}
