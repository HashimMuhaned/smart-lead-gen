import { Plus, MapPin, Users, Send, MailOpen, MessageSquareReply, CalendarCheck } from "lucide-react";
import { AppLayout } from "@/layout/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { campaigns } from "@/data/mock";

export default function EmailCampaigns() {
  return (
    <AppLayout title="Email Campaigns" subtitle="Manage and monitor your outreach campaigns">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[12.5px] text-ink-500">{campaigns.length} campaigns</p>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl signal-gradient text-white text-[12.5px] font-semibold">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {campaigns.map((c) => {
          const openRate = c.sent ? Math.round((c.opened / c.sent) * 100) : 0;
          return (
            <div key={c.id} className="bg-white rounded-[var(--radius-card)] card-hairline p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display text-[15px] font-semibold text-ink-900-solid">{c.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[12px] text-ink-500">
                    <span>{c.industry}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {c.location}
                    </span>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                <MiniStat icon={Users} label="Leads" value={c.leads} />
                <MiniStat icon={Send} label="Sent" value={c.sent} />
                <MiniStat icon={MailOpen} label="Opened" value={`${openRate}%`} />
                <MiniStat icon={MessageSquareReply} label="Replies" value={c.replies} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-paper-100">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-500">
                  <CalendarCheck className="w-3.5 h-3.5" /> {c.meetings} meetings booked
                </span>
                <div className="flex gap-2">
                  <button className="text-[12px] font-semibold text-ink-600 px-3 py-1.5 rounded-lg hover:bg-paper-50">
                    View report
                  </button>
                  <button className="text-[12px] font-semibold text-signal-600 px-3 py-1.5 rounded-lg hover:bg-signal-100">
                    {c.status === "Draft" ? "Launch" : "Manage"}
                  </button>
                </div>
              </div>

              <div className="mt-3 h-1.5 rounded-full bg-paper-100 overflow-hidden">
                <div
                  className="h-full signal-gradient"
                  style={{ width: `${c.leads ? Math.round((c.sent / c.leads) * 100) : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="bg-paper-50 rounded-xl p-2.5">
      <Icon className="w-3.5 h-3.5 text-ink-400 mb-1.5" />
      <p className="font-display text-[15px] font-semibold text-ink-900-solid leading-none">{value}</p>
      <p className="text-[10.5px] text-ink-500 mt-1">{label}</p>
    </div>
  );
}
