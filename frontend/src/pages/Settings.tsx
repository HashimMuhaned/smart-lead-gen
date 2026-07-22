import { useState } from "react";
import { User, Building, Bell, Plug, KeyRound } from "lucide-react";
import { AppLayout } from "@/layout/AppLayout";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business Info", icon: Building },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "api", label: "API Keys", icon: KeyRound },
];

const integrations = [
  { name: "Google Maps", desc: "Source for local business discovery", connected: true },
  { name: "Apollo.io", desc: "B2B contact and company data enrichment", connected: true },
  { name: "n8n", desc: "Automation workflows for scraping & outreach", connected: false },
  { name: "PostgreSQL", desc: "Primary database for leads and campaigns", connected: false },
  { name: "SMTP / Gmail", desc: "Send outreach emails from your own domain", connected: true },
];

export default function Settings() {
  const [active, setActive] = useState("profile");

  return (
    <AppLayout title="Settings" subtitle="Manage your account, business and integrations">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-card card-hairline p-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-left",
                    active === t.id ? "bg-signal-100 text-signal-600" : "text-ink-600 hover:bg-paper-50"
                  )}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {active === "profile" && (
            <div className="bg-white rounded-card card-hairline p-6">
              <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-5">Profile</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full signal-gradient flex items-center justify-center text-white text-[18px] font-semibold">
                  YN
                </div>
                <button className="px-3.5 py-2 rounded-lg border border-paper-200 text-[12.5px] font-medium">
                  Change photo
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name" defaultValue="Your Name" />
                <Field label="Email" defaultValue="you@leadai.io" />
                <Field label="Role" defaultValue="Freelance AI Automation Builder" />
                <Field label="Timezone" defaultValue="Asia/Dubai (GST)" />
              </div>
              <button className="mt-6 px-5 py-2.5 rounded-xl signal-gradient text-white text-[13px] font-semibold">
                Save changes
              </button>
            </div>
          )}

          {active === "business" && (
            <div className="bg-white rounded-card card-hairline p-6">
              <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-5">Business Info</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Company name" defaultValue="LeadAI Studio" />
                <Field label="Services offered" defaultValue="AI automation, CRM, chatbots, websites" />
                <Field label="Default outreach region" defaultValue="Dubai, UAE" />
                <Field label="Sending domain" defaultValue="outreach.leadai.io" />
              </div>
              <button className="mt-6 px-5 py-2.5 rounded-xl signal-gradient text-white text-[13px] font-semibold">
                Save changes
              </button>
            </div>
          )}

          {active === "notifications" && (
            <div className="bg-white rounded-card card-hairline p-6">
              <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-5">Notifications</h3>
              <div className="space-y-4">
                {["New reply received", "Meeting booked", "Lead search completed", "Weekly performance digest"].map(
                  (n) => (
                    <label key={n} className="flex items-center justify-between py-2 border-b border-paper-100 last:border-0">
                      <span className="text-[13px] text-ink-700">{n}</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#4F5BFF]" />
                    </label>
                  )
                )}
              </div>
            </div>
          )}

          {active === "integrations" && (
            <div className="bg-white rounded-card card-hairline p-6">
              <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-1">Integrations</h3>
              <p className="text-[12.5px] text-ink-500 mb-5">
                Frontend is mock-only for now — these connect once the backend, database and n8n workflows are wired up.
              </p>
              <div className="space-y-3">
                {integrations.map((i) => (
                  <div key={i.name} className="flex items-center justify-between p-4 rounded-xl border border-paper-200">
                    <div>
                      <p className="text-[13px] font-semibold text-ink-900-solid">{i.name}</p>
                      <p className="text-[12px] text-ink-500">{i.desc}</p>
                    </div>
                    <span
                      className={cn(
                        "text-[11.5px] font-semibold px-2.5 py-1 rounded-full",
                        i.connected ? "bg-mint-100 text-mint-500" : "bg-paper-200 text-ink-500"
                      )}
                    >
                      {i.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "api" && (
            <div className="bg-white rounded-[var(--radius-card)] card-hairline p-6">
              <h3 className="font-display text-[15px] font-semibold text-ink-900-solid mb-5">API Keys</h3>
              <div className="flex items-center justify-between p-4 rounded-xl border border-paper-200 mb-3">
                <div>
                  <p className="text-[13px] font-semibold text-ink-900-solid">Production key</p>
                  <p className="text-[12px] font-mono text-ink-500">sk_live_••••••••••••3f2a</p>
                </div>
                <button className="text-[12px] font-semibold text-signal-600">Revoke</button>
              </div>
              <button className="px-4 py-2.5 rounded-xl border border-paper-200 text-[12.5px] font-semibold text-ink-700">
                Generate new key
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-[12.5px] font-medium text-ink-600">{label}</label>
      <input
        defaultValue={defaultValue}
        className="w-full mt-1.5 px-3.5 py-2.5 rounded-lg border border-paper-200 text-[13.5px] outline-none focus:border-signal-400"
      />
    </div>
  );
}
