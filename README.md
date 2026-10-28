# Mira

AI-powered wellbeing and human support platform. *Someone to talk to. Support when you need it.*

Contact: miraaisupport@gmail.com

## Status (honest)

**Phase 1 — website foundation: done.** Static, responsive marketing site and design system.

| Area | State |
|---|---|
| Landing, pricing, safety, privacy, terms | Built. Privacy and terms are **drafts pending legal review**. |
| Sign-in / register | **Layout only**, disabled forms. No accounts yet. |
| Talk to Mira, Explore Support, Find a Professional, Appointments | "Not live yet" placeholder pages. |
| AI chat, voice, database, payments, video | **Not built yet** (Phases 2–9). |
| Crisis contacts | **Not published.** Only administrator-verified contacts will ever be shown. |

Launch strategy: **Free first.** Plus and Pro are shown as "Coming soon" and are controlled by feature flags
(`src/config/site.ts`, `FEATURE_FLAGS`), which are off. The features themselves will be built phase by phase,
and stay switched off until reviewed. Prices are not set (shown as "To be announced").

Plans, decisions and the full architecture: see `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build
```

Phase 1 needs no environment variables or API keys.

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
- `src/app` — pages
