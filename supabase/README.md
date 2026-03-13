# Eternia — Supabase Setup Guide

This guide walks you through setting up the Supabase backend for Eternia, the anonymous institutional student wellbeing platform. Follow every step in order.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create a Supabase Project](#2-create-a-supabase-project)
3. [Configure Environment Variables](#3-configure-environment-variables)
4. [Disable Email Confirmation](#4-disable-email-confirmation)
5. [Run Migrations (in order)](#5-run-migrations-in-order)
6. [Row Level Security](#6-row-level-security)
7. [Secrets Management](#7-secrets-management)
8. [Verifying the Setup](#8-verifying-the-setup)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Before you begin, make sure you have:

- A [Supabase](https://supabase.com) account (free tier works for local dev; **Pro plan recommended for production** — the free tier has a 500 MB database size limit and pauses after 1 week of inactivity)
- Access to the Supabase **SQL Editor** in the dashboard
- Your project's `.env.local` file ready (see step 3)
- Node.js v20 LTS installed locally

> **Phase 1 note:** Eternia is designed to run on Supabase Pro (~$25/month) as part of the Rs. 8,000–15,000/month infrastructure budget. Do not use the free tier in production — it will pause your database.

---

## 2. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com) and sign in.
2. Click **"New project"**.
3. Fill in the project details:
   - **Name:** `eternia-prod` (or `eternia-dev` for a development environment)
   - **Database Password:** Generate a strong password and **save it somewhere safe** — you will need it later.
   - **Region:** Choose **South Asia (Mumbai)** — this is mandatory for DPDP Act 2023 compliance. All Sensitive Personal Data must reside in India.
   - **Pricing Plan:** Select **Pro** for production.
4. Click **"Create new project"** and wait for provisioning (usually 1–2 minutes).

> **Important:** Create separate Supabase projects for `development`, `staging`, and `production`. Never run migrations directly on production without testing on staging first.

---

## 3. Configure Environment Variables

Once your project is provisioned, navigate to:

**Project Settings → API**

You will find the three values you need:

| Variable | Where to find it | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → "Project URL" | The public URL for your Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → "Project API keys" → `anon` `public` | Safe to expose client-side; subject to RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → "Project API keys" → `service_role` `secret` | **Never expose this client-side.** Bypasses RLS. Server-only. |

### Create your `.env.local` file

In the root of the Next.js project, create a file called `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> **Security rules:**
> - `.env.local` is already in `.gitignore` — confirm this before committing anything.
> - `SUPABASE_SERVICE_ROLE_KEY` must **never** appear in client-side code, browser bundles, or any `NEXT_PUBLIC_` variable.
> - In production (Vercel / Railway / Render), add these as environment secrets through the platform's secrets manager — never hard-code them.
> - Rotate the service role key immediately if it is ever accidentally committed or exposed.

---

## 4. Disable Email Confirmation

Eternia uses **fake internal emails** of the format `{username}@eternia.app` to create Supabase Auth users. These email addresses are never real inboxes — they exist solely to satisfy Supabase Auth's requirement for an email identifier.

Because of this, **email confirmation must be disabled**. If left enabled, every user registration will be stuck waiting for a confirmation email that will never arrive.

### Steps to disable email confirmation:

1. In your Supabase project dashboard, go to **Authentication → Providers → Email**.
2. Toggle **"Confirm email"** to **OFF**.
3. Click **Save**.

Also recommended:
- Under **Authentication → Email Templates**, you can leave these as-is since no real emails are ever sent.
- Under **Authentication → URL Configuration**, set the **Site URL** to your application's URL (e.g., `https://eternia.app` for production or `http://localhost:3000` for development).

> **Why fake emails?** Eternia's anonymity model means students never provide a real email address during onboarding. The `{username}@eternia.app` convention is an internal system identifier used only at the Supabase Auth layer. The `username` is institution-scoped and the only identity visible to other users on the platform.

---

## 5. Run Migrations (in order)

Migrations must be run in strict numerical order. Each migration depends on the previous one having completed successfully.

Navigate to your Supabase project → **SQL Editor → New Query**.

Paste the contents of each migration file and click **Run**. Proceed to the next only after the previous succeeds with no errors.

---

### Migration 001 — Database Schema

**File:** `supabase/migrations/001_schema.sql`

This migration creates all core tables:
- `institutions`, `users`, `user_private`, `device_sessions`
- `experts`, `peer_listeners`, `expert_availability`
- `appointments`, `peer_sessions`, `blackbox_entries`
- `escalation_requests`, `credit_transactions`
- `credit_balance` (materialized view)
- `sound_content`, `quest_cards`, `audit_logs`, `onboarding_sessions`
- All required indexes

**Expected result:** 18 tables created, 1 materialized view created, ~30+ indexes created. No errors.

---

### Migration 002 — Row Level Security Policies

**File:** `supabase/migrations/002_rls_policies.sql`

This migration:
- Enables RLS on all tables
- Creates access policies for each role (STUDENT, INTERN, EXPERT, SPOC, ADMIN)
- Locks down `user_private` so only the owning user can read their own record
- Makes `audit_logs` read-only for ADMIN and completely inaccessible for writes from the client

**Expected result:** RLS enabled on all tables, policies created. No errors.

> **Important:** After this migration, the `anon` key will be unable to read most tables. This is correct and expected behaviour. All authenticated access goes through the `authenticated` role, which is subject to RLS.

---

### Migration 003 — Functions and Triggers

**File:** `supabase/migrations/003_functions_and_triggers.sql`

This migration creates:
- `refresh_credit_balance()` — refreshes the `credit_balance` materialized view
- Trigger: auto-refresh credit balance after every credit transaction
- `update_updated_at_column()` — generic timestamp trigger
- `updated_at` triggers on all applicable tables
- `handle_new_user()` — post-signup hook for auth.users
- `validate_credit_balance()` — prevents negative credit balances at the DB layer
- `log_audit_event()` — helper function for writing audit log entries
- Immutability protection triggers for `audit_logs` and `credit_transactions`

**Expected result:** All functions and triggers created. No errors.

---

### Migration 004 — Seed Data

**File:** `supabase/migrations/004_seed_data.sql`

This migration seeds:
- 1 demo institution (`DEMO2025`)
- 6 expert therapists
- 6 peer listeners
- 10 sound therapy tracks
- 5 quest cards

**Expected result:** All seed rows inserted. No errors.

> **Note:** This seed data is safe to run on development and staging environments. For production, you may want to skip the demo institution row and insert real institution data separately. The experts, peer listeners, sounds, and quest cards are production-appropriate.

---

### Running all migrations at once (advanced)

If you are setting up a fresh environment and want to run everything in one go, you can concatenate the files and run them in a single transaction:

```sql
BEGIN;
\i supabase/migrations/001_schema.sql
\i supabase/migrations/002_rls_policies.sql
\i supabase/migrations/003_functions_and_triggers.sql
\i supabase/migrations/004_seed_data.sql
COMMIT;
```

> This is only recommended when using `psql` CLI with a direct database connection. In the Supabase SQL Editor, run each file individually.

---

## 6. Row Level Security

RLS is the primary access control mechanism for the Eternia database. Here is a summary of the security model:

| Table | Anon | Student | Intern | Expert | SPOC | Admin | Service Role |
|---|---|---|---|---|---|---|---|
| `institutions` | Read (code validation) | Read | Read | Read | Read + Update (own) | Full | Full |
| `users` | ❌ | Own record | Own record | Own record | Institution scope | Full | Full |
| `user_private` | ❌ | Own record only | ❌ | ❌ | ❌ (formal escalation only) | ❌ (formal escalation only) | Full |
| `experts` | ❌ | Read | Read | Read | Read | Full | Full |
| `peer_listeners` | ❌ | Read | Read | Read | Read | Full | Full |
| `appointments` | ❌ | Own records | ❌ | Booked sessions | Institution scope | Full | Full |
| `peer_sessions` | ❌ | Own sessions | Own sessions | ❌ | Institution scope | Full | Full |
| `blackbox_entries` | ❌ | Own entries only | ❌ | ❌ | ❌ | ❌ (escalation only) | Full |
| `credit_transactions` | ❌ | Own transactions | ❌ | ❌ | Institution scope | Full | Full |
| `sound_content` | ❌ | Read (active) | Read (active) | Read (active) | Read | Full | Full |
| `quest_cards` | ❌ | Read (active) | Read (active) | Read (active) | Read | Full | Full |
| `audit_logs` | ❌ | ❌ | ❌ | ❌ | ❌ | Read only | Full |
| `onboarding_sessions` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Full |

> **Service Role key** bypasses all RLS. It is used exclusively in server-side API routes (Next.js API routes or the Fastify backend). Never use the service role key in client-side code.

### Checking RLS is active

After running migration 002, you can verify RLS is enabled by running this query in the SQL Editor:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

---

## 7. Secrets Management

### Environment variable checklist

| Variable | Client-safe? | Where to set |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | `.env.local`, Vercel env, CI/CD |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes (RLS enforced) | `.env.local`, Vercel env, CI/CD |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **NO — server only** | `.env.local` (never committed), Vercel secret env, platform secret manager |

### Production secrets management

- **Phase 1 (Railway / Render / Vercel):** Use the platform's built-in environment variable / secrets management UI. Mark `SUPABASE_SERVICE_ROLE_KEY` as a secret (not exposed in build logs).
- **Phase 2+ (AWS):** Migrate to AWS Secrets Manager. Reference secrets via ARN in ECS task definitions. Never hard-code in Dockerfiles or `docker-compose.yml`.

### What to NEVER do

- ❌ Never commit `.env.local` or `.env.production` to git
- ❌ Never log the service role key anywhere (console, Sentry, analytics)
- ❌ Never pass the service role key to the frontend bundle
- ❌ Never use the service role key in a `NEXT_PUBLIC_` variable
- ❌ Never store the service role key in `localStorage` or cookies

### If a key is accidentally exposed

1. Go to Supabase → **Project Settings → API → Rotate keys**
2. Immediately update all platform environment variables with the new key
3. Redeploy all services
4. Audit git history and purge the exposed key using `git filter-branch` or BFG Repo-Cleaner
5. Log the incident in your internal audit log

---

## 8. Verifying the Setup

After all four migrations have run successfully, verify your setup with these checks in the SQL Editor:

### Check all tables exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: 17 tables + the `credit_balance` materialized view.

### Check all indexes exist
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Check seed data loaded
```sql
SELECT COUNT(*) FROM public.experts;          -- Expected: 6
SELECT COUNT(*) FROM public.peer_listeners;   -- Expected: 6
SELECT COUNT(*) FROM public.sound_content;    -- Expected: 10
SELECT COUNT(*) FROM public.quest_cards;      -- Expected: 5
SELECT COUNT(*) FROM public.institutions;     -- Expected: 1 (DEMO2025)
```

### Check triggers are active
```sql
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### Test credit balance materialized view
```sql
SELECT * FROM public.credit_balance LIMIT 5;
-- Should return empty (no transactions yet) — no error means the view is healthy
```

---

## 9. Troubleshooting

### "relation does not exist" when running migration 002 or later

You likely ran migrations out of order. Drop all tables and re-run from `001_schema.sql`.

```sql
-- Emergency reset (DESTROYS ALL DATA — dev/staging only!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run all four migrations in order.

### "permission denied for table users" in the app

This usually means you are using the **anon key** in a server-side API route that needs elevated permissions. Switch to the **service role key** for server-side operations that require bypassing RLS.

### Supabase Auth user created but no row in `public.users`

The `handle_new_user()` trigger in migration 003 is responsible for this. Check:
1. That migration 003 ran successfully
2. That the trigger `on_auth_user_created` exists:
   ```sql
   SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
   ```
3. Check Supabase logs (Dashboard → Logs → Edge Functions) for any trigger errors.

### Email confirmation emails being sent despite being disabled

Double-check **Authentication → Providers → Email → Confirm email = OFF** in the Supabase dashboard. This must be set per-project and does not inherit from any default.

### Materialized view `credit_balance` is stale

The trigger in migration 003 should refresh it automatically after every `INSERT` on `credit_transactions`. If you need to manually refresh:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.credit_balance;
```

Note: `CONCURRENTLY` requires at least one unique index on the view. This is created in migration 001.

### "duplicate key value violates unique constraint" on seed data

The seed migration uses `ON CONFLICT DO NOTHING` to make it idempotent. If you see this error, you may be running a custom insert. Check for duplicate `eternia_code` values in the `institutions` table.

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [PostgreSQL RLS Reference](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Eternia PRD — `prd_extracted.txt` in the project root (full technical specification)

---

*Eternia v1.0 — Phase 1 Infrastructure | Supabase Pro | India Region (Mumbai)*
*DPDP Act 2023 Compliant | AES-256-GCM at rest | TLS 1.3 in transit*