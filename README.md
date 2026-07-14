# LeadAI — Frontend Dashboard (Mock Data Only)

A frontend-only SaaS dashboard for an AI-powered lead generation & outreach platform.
No backend, database, auth, or real scraping — everything runs on mock data in `src/data/`.

## Stack

- React 19 + TypeScript
- Tailwind CSS v4
- React Router
- Recharts (charts)
- Lucide (icons)

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/     Reusable UI: MetricCard, ChartCard, DataTable, LeadCard,
                   AnalysisCard, EmailPreview, StatusBadge, ScoreRing, Pagination
  layout/         Sidebar, Header, MobileNav, AppLayout
  pages/          One file per route (Dashboard, LeadDiscovery, Businesses,
                   BusinessDetails, AIAnalysis, EmailCampaigns, Templates,
                   Analytics, Settings)
  data/           Mock data (businesses.ts, mock.ts) — swap these for real
                   API calls later
  types/          Shared TypeScript interfaces (Business, Campaign, etc.)
  lib/            Small utilities (cn, status/score color helpers)
```

## Connecting the real backend later

Every page currently imports static arrays from `src/data/`. To wire up your
real stack:

1. Replace the imports in each page (`businesses`, `campaigns`, `searchRuns`,
   `emailTemplates`, analytics arrays) with data-fetching hooks
   (`fetch`, `react-query`, etc.) that call your backend API.
2. The `Business`, `Campaign`, `SearchRun`, and `EmailTemplate` types in
   `src/types/index.ts` describe the exact shape the UI expects — keep your
   API responses matching these shapes (or map them) and the components
   need no changes.
3. `EmailPreview`'s Regenerate/Approve buttons are wired to local state only —
   connect them to your AI-generation and approval endpoints.
4. "Start Lead Search" on the Lead Discovery page is a simulated 1.6s delay —
   point it at your n8n webhook / scraping job trigger.

```
Frontend  →  Backend API  →  PostgreSQL
                 |
                 +--  n8n automation workflows
```
