# Architecture notes

A quick map of how the pieces fit together. Read this once and you'll be able to find anything.

## Routes

| Path                                  | Purpose                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `/`                                   | Marketing landing page (public)                                         |
| `/login`, `/signup`                   | Supabase email/password auth                                            |
| `/dashboard`                          | Portfolio overview — KPIs, properties list, compliance alerts           |
| `/properties` · `/properties/new`     | Portfolio grid + create form                                            |
| `/properties/[id]`                    | Property detail with KPIs, compliance summary, tenant, recent docs      |
| `/properties/[id]/compliance`         | Add certificates, view history                                          |
| `/properties/[id]/rent`               | Per-property rent ledger (6 month rolling)                              |
| `/properties/[id]/maintenance`        | Add / complete inspections and tasks                                    |
| `/properties/[id]/documents`          | Upload documents, view Claude AI summaries                              |
| `/properties/[id]/journey`            | Two-sided tenancy journey                                               |
| `/properties/[id]/tenants/new`        | Add an active tenant (auto-generates portal token)                      |
| `/compliance`, `/rent`, `/maintenance`, `/documents` | Cross-portfolio views                                  |
| `/tenants`                            | All active tenants + portal links                                       |
| `/faults` · `/faults/[id]`            | Landlord fault inbox + per-fault transcript / contractor booking        |
| `/notices`                            | Section 13 rent increase notice generator                               |
| `/notifications`                      | In-app feed of email/push events                                        |
| `/settings`                           | Profile                                                                 |
| `/portal/[token]`                     | **Public** tenant portal home (token-gated, service role used)          |
| `/portal/[token]/report`              | **Public** guided fault reporting form                                  |

## API routes

| Path                              | Method | Description                                                          |
| --------------------------------- | ------ | -------------------------------------------------------------------- |
| `/api/health`                     | GET    | Liveness check                                                       |
| `/api/portal/fault`               | POST   | Tenant-side fault submission (token-gated, multipart upload)         |
| `/api/ai/summarise-document`      | POST   | Server-only Claude call to summarise an uploaded document            |
| `/api/pdf/fault/[id]`             | GET    | Court-ready fault transcript PDF                                     |
| `/api/pdf/arrears/[id]`           | GET    | Rent arrears statement PDF for a property (Section 8 evidence)       |
| `/api/pdf/section13`              | POST   | Section 13 rent increase notice PDF                                  |
| `/api/cron/notifications`         | GET    | Daily cron — compute events from rules, persist + send via SendGrid  |

## Data model

The full schema is in `supabase/migrations/20260101000000_initial_schema.sql`. Highlights:

- **profiles** — one row per Supabase auth user; carries `role` (owner / manager / readonly / tenant).
- **properties** — owner-scoped. Owner has full RLS access; managers / readonly get select via `is_owner_or_manager()`.
- **tenants** — has a `portal_token` (32 hex chars). Tenant portal pages look up by this token using the service-role client, bypassing RLS.
- **compliance_certificates** — `expires_on` is computed in the app from `completed_on` using `expiryFromCompletion()`. UK rules baked into `lib/compliance.ts`.
- **rent_payments** — one row per property/period. Seeded for the last 6 months when you open the rent page.
- **maintenance_tasks** — inspections carry `recur_days = 120`; on completion the server inserts the next occurrence automatically.
- **fault_reports + fault_events** — `fault_events` is append-only (insert-only RLS policy). This is the court-evidence chain.
- **contractor_bookings** — joined to a fault when relevant; tenant portal shows the next 3 upcoming.
- **documents** — `ai_summary` and `ai_summary_at` are written by `/api/ai/summarise-document`.
- **tenancy_journey** — one row per (property, tenant, step). `landlord_sign` / `tenant_sign` tracked separately.
- **notifications + push_subscriptions** — feed for the alerts page; cron writes here.

## RLS in plain English

- A landlord can do anything to **their** properties and all child rows.
- Managers and readonly users can **read** everything (governed by `is_owner_or_manager()`), but only owners + managers can **edit** (`can_edit_property()`).
- The tenant portal does **not** use anonymous SELECT policies. Instead the server route uses the service role and looks the tenant up by `portal_token`, then exposes only that tenant's data.
- Notifications and push subscriptions are user-scoped (`user_id = auth.uid()`).

## Notification cadences

Defined in `lib/notifications/rules.ts` and triggered by `/api/cron/notifications`:

| Rule                | Cadence                          |
| ------------------- | -------------------------------- |
| Gas Safety due      | 60 days before expiry, every day |
| EICR due            | 60 days                          |
| EPC due             | 90 days                          |
| Buildings Insurance | 60 days                          |
| Inspection due      | 120 days                         |
| Rent overdue        | Day after due date               |
| Fault submitted     | Immediately (push)               |
| Fault unresolved    | 7 days after report              |

## Adding a property — what happens end-to-end

1. Owner submits `/properties/new` (server action) → `properties.insert` with `owner_id = auth.uid()`.
2. Add a tenant via `/properties/[id]/tenants/new` → property status flips to `tenanted`; a `portal_token` is auto-generated by the DB default.
3. Share `/portal/<token>` with the tenant.
4. Upload the tenancy agreement under `/properties/[id]/documents`. Tick "Generate Claude summary" — the client POSTs to `/api/ai/summarise-document`, the server downloads the file from Supabase Storage with the service role, runs Claude on it, and writes `ai_summary` back.
5. As compliance certificates land, add each one — `expires_on` is auto-calculated.

## Adding a feature

The cleanest extension points are:

- **New compliance type** — add to the `compliance_type` enum in SQL, update `COMPLIANCE_META` in `lib/compliance.ts`. Everything else flows.
- **New notification rule** — add a function to `lib/notifications/rules.ts` and include it in the cron handler.
- **New PDF** — drop a generator into `lib/pdf.ts` and a route under `src/app/api/pdf/…`.
