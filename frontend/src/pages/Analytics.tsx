import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { AppLayout } from "@/layout/AppLayout";
import { ChartCard } from "@/components/ChartCard";
import { outreachPerformance, leadSourceBreakdown, conversionFunnel } from "@/data/mock";

export default function Analytics() {
  return (
    <AppLayout title="Analytics" subtitle="Full-funnel performance across your outreach">
      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Emails Sent" subtitle="Daily volume, last 7 days">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={outreachPerformance}>
              <CartesianGrid vertical={false} stroke="#EEF0F7" />
              <XAxis dataKey="label" tick={{ fontSize: 11.5, fill: "#7C859C" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11.5, fill: "#7C859C" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E5F0", fontSize: 12.5 }} />
              <Bar dataKey="sent" fill="#4F5BFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open & Reply Rate" subtitle="Trend across the week">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={outreachPerformance}>
              <CartesianGrid vertical={false} stroke="#EEF0F7" />
              <XAxis dataKey="label" tick={{ fontSize: 11.5, fill: "#7C859C" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11.5, fill: "#7C859C" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E5F0", fontSize: 12.5 }} />
              <Line type="monotone" dataKey="opened" stroke="#17B897" strokeWidth={2.5} dot={false} name="Opened" />
              <Line type="monotone" dataKey="replies" stroke="#F2A93B" strokeWidth={2.5} dot={false} name="Replies" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Conversion Funnel" subtitle="Businesses found → meetings booked" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <FunnelChart>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E5F0", fontSize: 12.5 }} />
              <Funnel dataKey="value" data={conversionFunnel} isAnimationActive>
                {conversionFunnel.map((_, i) => (
                  <Cell key={i} fill={["#4F5BFF", "#6870FF", "#7B83FF", "#9C7BFF", "#17B897", "#F2A93B"][i]} />
                ))}
                <LabelList position="right" dataKey="stage" fill="#10152280" stroke="none" fontSize={12.5} />
                <LabelList position="left" dataKey="value" fill="#fff" stroke="none" fontSize={12.5} fontWeight={600} />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Source Breakdown" subtitle="Where your leads come from">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={leadSourceBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {leadSourceBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E5F0", fontSize: 12.5 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12.5 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Key Rates" subtitle="Snapshot across all campaigns">
          <div className="grid grid-cols-2 gap-4 h-60 content-center">
            {[
              { label: "Open Rate", value: "34.9%", color: "text-signal-600" },
              { label: "Reply Rate", value: "6.8%", color: "text-mint-500" },
              { label: "Meeting Rate", value: "1.3%", color: "text-amber-500" },
              { label: "Conversion Rate", value: "0.3%", color: "text-coral-500" },
            ].map((s) => (
              <div key={s.label} className="bg-paper-50 rounded-2xl p-4 text-center">
                <p className={`font-display text-[26px] font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-[12px] text-ink-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </AppLayout>
  );
}
