# Setup — step by step

This guide assumes you have Node 20+ installed locally. It walks you from a clean repo to a deployed app.

## 1. Local install

```bash
npm install
cp .env.local.example .env.local
# fill in values as you finish the steps below
npm run dev
```

## 2. Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a new project. Pick the London region for UK data residency.
2. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to browser)
3. Open the **SQL editor** and run, in order:
   - `supabase/migrations/20260101000000_initial_schema.sql`
   - `supabase/migrations/20260101000100_storage_buckets.sql`
4. Open **Storage** and confirm three buckets exist: `property-documents`, `fault-media`, `avatars`.
5. Open **Authentication → Providers** and ensure email/password is enabled. Optionally enable email confirmations.

## 3. SendGrid (email)

1. Create a SendGrid account, then **Settings → API Keys** → create a key with "Mail Send: Full Access".
2. **Settings → Sender Authentication** → verify a single sender (e.g. `notifications@yourdomain.co.uk`) or authenticate the whole domain (DKIM).
3. Fill in `.env.local`:
   - `SENDGRID_API_KEY=SG.…`
   - `SENDGRID_FROM_EMAIL=notifications@yourdomain.co.uk`
   - `SENDGRID_FROM_NAME=Blake UK Homes`

## 4. Anthropic (Claude AI)

1. Create an API key at [console.anthropic.com](https://console.anthropic.com).
2. Set:
   - `ANTHROPIC_API_KEY=sk-ant-…`
   - `ANTHROPIC_MODEL=claude-sonnet-4-6` (default; change if you want a different model)

## 5. VAPID keys (web push)

```bash
npx web-push generate-vapid-keys
```

Copy the output into `.env.local`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJ…
VAPID_PRIVATE_KEY=…
VAPID_SUBJECT=mailto:you@yourdomain.co.uk
```

## 6. GitHub repo (private)

```bash
git init
git add .
git commit -m "Initial Blake UK Homes scaffold"
gh repo create blake-uk-homes --private --source=. --remote=origin --push
```

(Or create the repo manually in GitHub and push.) The repo is private — you own all the code.

## 7. Vercel

1. Import the GitHub repo into Vercel.
2. **Project Settings → Environment Variables** — paste every key from `.env.local`. Mark the secret ones (service role, Anthropic, SendGrid, VAPID private) as "Sensitive".
3. Add one extra: `CRON_SECRET` — generate a random string. The daily notification cron uses it as a bearer token.
4. Deploy. Confirm the deploy succeeded by hitting `/api/health` on the deployed URL.

`vercel.json` already declares the daily cron at 07:00:

```
{ "path": "/api/cron/notifications", "schedule": "0 7 * * *" }
```

In Vercel **Project Settings → Crons**, edit the cron to send the `Authorization: Bearer <CRON_SECRET>` header (Vercel auto-injects `Authorization` when `CRON_SECRET` is in env vars on Pro/Hobby).

## 8. Domain (optional)

Add your custom domain in Vercel **Project Settings → Domains**. After the cert provisions, set `NEXT_PUBLIC_APP_URL` env var to the new URL and redeploy.

## 9. Sign in

Open the deployed URL, hit "Get started", create your account. The Supabase trigger auto-creates a `profiles` row with role `owner`.

If you want a **Manager** account (e.g. a property manager helping you), sign them up the same way and then `update public.profiles set role='manager' where email='…'` in the Supabase SQL editor. Same pattern for `readonly` (e.g. solicitor handover).

## 10. PWA icons

Drop two PNGs into `public/icons/`:

- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

See `public/icons/README.md`.

---

That's the whole setup. If anything goes wrong, hit `/api/health` first — it returns a simple JSON ok payload and bypasses Supabase. If it works, the Next runtime is fine and the issue is elsewhere (env var, Supabase, etc.).
