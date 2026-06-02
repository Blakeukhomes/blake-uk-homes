# Blake UK Homes

A private property management Progressive Web App for Blake UK Homes — a UK private landlord. Compliance, rent, tenant communication, court-ready evidence, and AI document summarization — in one workspace you own end-to-end.

This is **your** codebase. The GitHub repo and Vercel project should be yours; Supabase and SendGrid accounts are yours. No third party retains access to data.

## Highlights

- **Property dashboard** — status (Tenanted / Vacant / Legal Proceedings), monthly rent, compliance alerts, court-readiness score.
- **Compliance tracker** — Gas Safety (annual / 60-day warning), EICR (5 years / 60-day), EPC (10 years / 90-day), Buildings Insurance (annual / 60-day).
- **Rent ledger** — monthly view, paid / partial / late / missing, arrears computed automatically, 6-month rolling history. Court-ready arrears PDF.
- **Maintenance scheduler** — quarterly inspections recurring every 120 days, custom one-off tasks, auto-reschedule.
- **Tenant portal** — unique URL per tenant (`/portal/<token>`), guided fault reporting with mandatory photo + video, contractor booking visible to tenant.
- **Court-ready PDFs** — fault transcripts (every action timestamped, append-only), Section 13 rent increase notices (effective date auto-calculated to today + 2 months), arrears statements.
- **Two-sided tenancy journey** — landlord and tenant see the same 9-step track from Property Setup to Deposit Resolution.
- **Document storage** — tenancy agreements, deposit certificates, How to Rent guide, inventories — with **Claude AI summaries** for any uploaded document.
- **Notifications** — email (SendGrid) + web push, fired by a daily Vercel cron at 07:00.
- **PWA** — installable, offline-capable shell, web push notifications.
- **Role-based access** — Owner (full), Manager (full visibility / limited edit), Read-only (solicitor / handover).

## Tech stack

| Layer            | Technology                                    |
| ---------------- | --------------------------------------------- |
| Framework        | Next.js 14 (App Router, RSC, Server Actions)  |
| Database         | Supabase (Postgres) with RLS                  |
| Auth             | Supabase Auth (email/password)                |
| Storage          | Supabase Storage (documents, fault media)     |
| Email            | SendGrid                                      |
| Push             | Web Push API + service worker                 |
| PDF              | jsPDF + jsPDF-AutoTable                       |
| AI               | Anthropic Claude (`@anthropic-ai/sdk`)        |
| Styling          | Tailwind CSS                                  |
| Hosting          | Vercel                                        |
| Cron             | Vercel Cron Jobs                              |

## Project layout

```
src/
├── app/
│   ├── (auth)/login, signup
│   ├── (app)/                   # authenticated workspace
│   │   ├── dashboard
│   │   ├── properties/[id]/{compliance,rent,maintenance,documents,journey,tenants}
│   │   ├── compliance, rent, maintenance, documents
│   │   ├── tenants, faults, notices, notifications, settings
│   ├── portal/[token]/          # tenant-facing portal (no login, token-gated)
│   ├── api/
│   │   ├── ai/summarise-document
│   │   ├── pdf/{fault,arrears,section13}
│   │   ├── portal/fault
│   │   └── cron/notifications
│   └── page.tsx                 # marketing landing
├── components/                  # UI primitives, app shell, journey, skyline
├── lib/                         # supabase clients, compliance, rent, pdf, notifications
└── middleware.ts                # cookie refresh / public routes
supabase/migrations/             # SQL schema + storage buckets
public/                          # manifest.webmanifest, sw.js, icons/
```

## Get started

1. Copy `.env.local.example` to `.env.local` and fill in the credentials. See `SETUP.md` for getting each one.
2. `npm install`
3. `npm run dev` — the app boots at http://localhost:3000.

For a full deployment walkthrough — Supabase project, Vercel, GitHub, SendGrid sender verification, Anthropic API key, VAPID push keys, daily cron — see [`SETUP.md`](./SETUP.md).
