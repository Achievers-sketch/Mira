# Mira

AI-powered wellbeing and human support platform. *Someone to talk to. Support when you need it.*

Contact: miraaisupport@gmail.com

## Status (honest)

**Phase 1 — website foundation: done.**
**Phase 2 — accounts and database: done and verified on the live site** (sign-up, confirmation email, dashboard).
**Phase 3 — AI chat: code done, NOT yet live.** It needs migration `0002_chat.sql` applied and the secrets below added in Vercel.

| Area | State |
|---|---|
| Landing, pricing, safety, privacy, terms | Built. Privacy and terms are **drafts pending legal review**. |
| Sign-up / sign-in / sign-out, dashboard | Built. Switches on when Supabase env vars are set; otherwise shows an honest "not set up" notice. **Not yet tested against a real Supabase project.** |
| Database (profiles, roles, plans, subscriptions) + RLS | Migration written; 23 RLS checks pass on a local PostgreSQL with a Supabase-style shim. **Not yet applied to a real Supabase project.** |
| Talk to Mira (AI chat) | Built: streaming Claude replies, saved history, delete, monthly + per-minute limits, crisis notice, AI disclaimer, "Request human support" (says coming soon). Tested with a fake Supabase and a fake Claude API; **never yet run against the real Claude API or real Supabase.** Shows an honest "not switched on" notice until configured. |
| Explore Support, Find a Professional, Appointments | "Not live yet" placeholder pages. |
| Voice, providers, booking, video, payments, admin | **Not built yet** (Phases 4–10). |
| Crisis contacts | **None published.** The table exists; only contacts an administrator has verified and activated are ever shown (enforced by the database). No admin screen yet (Phase 9). |

Launch strategy: **Free first.** Plus and Pro are shown as "Coming soon" and are controlled by feature flags
(`src/config/site.ts`, `FEATURE_FLAGS`), which are off. The features themselves will be built phase by phase,
and stay switched off until reviewed. Prices are not set (shown as "To be announced").

Plans, decisions and the full architecture: see `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test            # unit tests (entitlements, validation)
npm run test:rls    # database security tests (needs PostgreSQL binaries; uses a throwaway local DB)
npm run build
```

The site runs without any keys; accounts stay switched off until Supabase is connected.

## Connect Supabase

1. Create a project at supabase.com.
2. SQL editor → run `supabase/migrations/0001_foundation.sql`.
3. Authentication → URL configuration: set Site URL to your Vercel URL and add `<your-url>/auth/callback` to Redirect URLs.
4. Project Settings → API: copy the Project URL and anon key.
5. In Vercel → Settings → Environment Variables add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` (your site URL), then redeploy.
6. Make yourself an admin (server-side only, in the SQL editor): `insert into public.user_roles (user_id, role) values ('<your-auth-user-id>', 'admin');`

Never put the `service_role` key in the browser or in any `NEXT_PUBLIC_` variable.

## Turn on the AI chat (Phase 3)

1. Supabase SQL editor: paste and run the **contents** of `supabase/migrations/0002_chat.sql` (after 0001).
2. Get an API key at console.anthropic.com.
3. In Vercel add these as **Secret** variables (they must NOT start with `NEXT_PUBLIC_`), then redeploy:
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → `service_role`). It bypasses database security, so keep it secret and server-only.
   - optional `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`)
4. Try `/talk` while signed in.

Safety design is described in `docs/SAFETY.md`. **It must be reviewed by a qualified mental-health professional before real users rely on it.**

## Deploy on Vercel

1. vercel.com → **Add New → Project** → import `Achievers-sketch/Mira`.
2. Framework preset: Next.js (auto-detected). No environment variables needed yet.
3. Every push to `main` deploys to production.

Later phases will need keys (see `docs/ARCHITECTURE.md` §7). Set them in Vercel → Settings → Environment
Variables, never in the repo.

## Structure

- `src/config/site.ts` — site info, plans, feature flags, navigation
- `src/components/ui` — Button, Card, Badge, Alert, Field, Dialog, Spinner
- `src/components/site` — Header, Footer, PlanCard, ComingSoon, AuthLayout
- `src/app` — pages; `src/app/auth` — server actions and email callback
- `src/lib` — Supabase clients, auth data-access layer (`auth/dal.ts`), entitlements, validation
- `src/proxy.ts` — session refresh and optimistic redirects
- `supabase/migrations` — database schema and Row Level Security
- `tests` — unit tests and RLS tests
