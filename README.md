# Multia Prompt Studio

A Next.js (App Router, TypeScript) AI **prompt generator** powered by Google Gemini. It produces structured, copy‑paste prompts across **Image**, **Website** (incl. Awwwards‑caliber 3D), and **Video** modes — and ships with a live **admin panel** that manages an unlimited, self‑healing pool of free Gemini API keys.

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev                  # http://localhost:3000
```

Without any config the studio runs off the `GEMINI_API_KEY_1..5` env vars (a fallback). For the full self‑healing key pool + admin panel, set up Supabase + the admin password as described next.

---

## Admin panel (`/admin`)

A password‑gated control panel — same app, same deployment — for managing Gemini keys **live, with no redeploy**. The studio reads the same Supabase pool, so anything you change here takes effect immediately.

### One‑time setup (2 steps)

1. **Run the SQL.** Open your Supabase project → **SQL Editor** → paste and run [`supabase/api-keys.sql`](supabase/api-keys.sql). (The panel's **Setup** tab also shows this SQL with a Copy button + a "Check setup" verifier.)
2. **Set the env vars** (in Vercel → Project → Settings → Environment Variables, then redeploy):

   | Variable | Purpose |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server‑only service‑role key (never `NEXT_PUBLIC_`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (used by the studio's realtime counter) |
   | `ADMIN_PANEL_PASSWORD` | The password you type to log in at `/admin` |
   | `ADMIN_COOKIE_SECRET` | *(optional)* HMAC secret for the session cookie; falls back to the password |

   > These bootstrap vars must live in the host env — the panel can't store its own database connection inside that database.

Then open `/admin`, log in, and add your keys.

### What it does

- **Add keys live** — one at a time or **bulk paste** (one per line / comma‑separated). Each is validated on add via a **free** models‑list call (no quota used) and de‑duplicated.
- **Self‑healing rotation** — every generation atomically claims the healthiest key and reports the result. A rate‑limited key is **never** re‑used until it recovers; recovery is learned from real traffic (**no probe requests waste quota**).
  - Per‑minute 429 → ~60s cooldown · daily (RPD) → next Pacific midnight · invalid key → auto‑disabled.
  - **Predictive guards** skip a key just *before* it crosses its RPM/RPD cap, so users rarely see a 429 at all.
  - If the whole pool is briefly busy, the studio shows a **live countdown and auto‑retries** — no error, no re‑press.
- **Per‑key Test button** — sends one real request (opt‑in, uses 1 request) to confirm a key works; the result also updates pool health.
- **Account/project grouping** — group keys by Google account/project, with a warning that same‑project keys share one quota pool (real headroom needs **separate accounts**).
- **Live dashboards** — pool summary + capacity forecast, per‑key 7‑day analytics, and a realtime **error feed** that separates user‑facing failures from silently‑recovered rate‑limits.
- **Global controls** — adjustable daily prompt cap, a **maintenance** kill‑switch, default‑model switch, and an audit log.

Auth uses the Next 16 `proxy.ts` convention to guard `/admin/*` and `/api/admin/*`.

---

## Key files

| Path | Role |
| --- | --- |
| [`lib/gemini.ts`](lib/gemini.ts) | Prompt generation + key claim/report + in‑request failover |
| [`lib/api-keys.ts`](lib/api-keys.ts) | Pool operations (claim, report, validate, CRUD, test, bulk) |
| [`lib/admin-auth.ts`](lib/admin-auth.ts) | HMAC‑signed cookie session (Edge‑safe) |
| [`proxy.ts`](proxy.ts) | Auth gate for `/admin/*` and `/api/admin/*` |
| [`app/admin/_components/dashboard.tsx`](app/admin/_components/dashboard.tsx) | Admin UI (Keys · Analytics · Errors · Settings · Setup) |
| [`supabase/api-keys.sql`](supabase/api-keys.sql) | Schema + RPCs (run once in Supabase) |
