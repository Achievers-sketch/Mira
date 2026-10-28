# Mira — Architecture Plan (Draft for Approval)

Status: **proposal, nothing implemented yet.** Implementation of Phase 1 waits for approval of this document.
Hosting: Vercel (Next.js). Source: GitHub `Achievers-sketch/Mira`.

---

## 1. Product architecture

```
Browser (Next.js App Router, React, Tailwind)
   │  Web Speech API (STT/TTS, feature-detected, text fallback)
   ▼
Vercel (Next.js server: Route Handlers + Server Actions)
   ├─ Auth/session guard (Supabase SSR cookies)
   ├─ Entitlement guard (plan limits enforced server-side)
   ├─ AI layer ──► Anthropic Claude API (server only)
   │     └─ Scoped tools: searchProviders, getAvailability, requestBooking,
   │        getMyBookingStatus, getMyEntitlements, getApprovedResources
   ├─ Video abstraction ──► Daily (server creates rooms/tokens)
   ├─ Payment abstraction ──► Paystack (verified webhooks)
   └─ Supabase (Postgres + Auth + RLS)
```

Principles
- Plan (Free/Plus/Pro) is an **entitlement**, never a security **role**.
- The AI never touches the database directly; it calls narrow, authenticated, validated server tools.
- Every third-party integration sits behind an interface with a clearly labelled **demo mode** when credentials are missing.
- Safety content (crisis contacts, limits of the AI) is never paywalled.
- Secrets live only in Vercel environment variables.

## 2. Folder structure

```
mira/
├─ docs/                     ARCHITECTURE.md, SECURITY.md, SAFETY.md, RLS.md
├─ supabase/
│  ├─ migrations/            versioned SQL (schema, RLS, constraints)
│  └─ seed.sql               demo data, labelled DEMO
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/        home, pricing, privacy, terms, safety
│  │  ├─ (auth)/             sign-in, register
│  │  ├─ (app)/              dashboard, chat, support, professionals,
│  │  │                      appointments, account
│  │  ├─ provider/           provider dashboard
│  │  ├─ admin/              admin dashboard
│  │  └─ api/                route handlers (see §5)
│  ├─ components/ui/         buttons, fields, cards, dialogs, alerts
│  ├─ components/chat|voice|booking|providers/
│  ├─ lib/
│  │  ├─ supabase/           server, browser, admin(server-only) clients
│  │  ├─ auth/               requireUser, requireRole
│  │  ├─ entitlements/       plan config + checks
│  │  ├─ ai/                 prompts, tool definitions, safety filter
│  │  ├─ video/              VideoProvider interface + Daily + demo
│  │  ├─ payments/           PaymentProvider interface + Paystack + demo
│  │  ├─ speech/             capability detection
│  │  └─ validation/         zod schemas
│  └─ config/                plans.ts (prices/limits, NGN, configurable)
├─ tests/                    unit, RLS, e2e
├─ .env.example
└─ README.md
```

## 3. Database entity plan (Supabase / Postgres)

| Entity | Purpose | Key relations |
|---|---|---|
| `profiles` | app user data (no secrets) | 1:1 `auth.users` |
| `roles`, `user_roles` | security roles | user ⇄ role (admin-assigned only) |
| `plans` | configurable plans, prices (NGN kobo), limits | — |
| `subscriptions` | status, period, provider refs | user → plan |
| `usage_counters` | AI message limits per period | user |
| `provider_profiles` | display info, category, bio, languages, price, active | user |
| `provider_categories` | peer, mentor, counsellor, psychologist, other | — |
| `provider_qualifications` | claimed credentials + evidence ref | provider |
| `provider_verifications` | admin decision, reviewer, date | provider |
| `availability_rules` / `availability_slots` | recurring + concrete UTC slots | provider |
| `bookings` | status machine, UTC times, fee snapshot | user, provider, slot |
| `call_sessions` | video room refs, join window | booking |
| `payments` | provider ref, amount, status, idempotency key | user, booking/subscription |
| `webhook_events` | stored event IDs for idempotency | — |
| `support_resources` | admin-verified resources | — |
| `crisis_contacts` | admin-verified only, by country | — |
| `consents` | versioned consent records (privacy, sharing) | user |
| `conversations`, `messages` | chat history, owner-only, retention-limited | user |
| `audit_events` | sensitive admin actions, minimal | actor |

Critical constraints
- **No double booking:** Postgres exclusion constraint on `(provider_id, tstzrange(start, end))` for active statuses, plus server validation.
- All timestamps `timestamptz` in UTC; time zone shown in UI.
- No raw card data and no raw audio are ever stored.
- Chat history is owner-only; admins and providers cannot read it. Sharing context requires an explicit per-booking consent record.

## 4. Role and permission matrix

Roles (separate from plans): visitor, user, peer_supporter, professional, admin.

| Capability | Visitor | User | Peer | Professional | Admin |
|---|---|---|---|---|---|
| View marketing, safety page, crisis contacts | ✔ | ✔ | ✔ | ✔ | ✔ |
| AI chat (within plan limits) | ✖ | ✔ | ✔ | ✔ | ✔ |
| Own profile / conversations | ✖ | ✔ own | ✔ own | ✔ own | ✖ content by default |
| Browse peer directory | ✖ | Plus+ | Plus+ | Plus+ | ✔ |
| Browse professional directory / book | ✖ | Pro | Pro | Pro | ✔ |
| Manage own provider profile & availability | ✖ | ✖ | ✔ | ✔ | ✔ |
| See bookings they are part of | ✖ | ✔ own | ✔ own | ✔ own | ✔ metadata |
| Verify providers, manage plans/resources/crisis contacts | ✖ | ✖ | ✖ | ✖ | ✔ (audited) |
| Read private chats | ✖ | own | ✖ | ✖ | ✖ |

Entitlements (Free / Plus / Pro) are checked in `lib/entitlements` on the server for every gated API route. Users cannot write to `user_roles`, `subscriptions` or `plans` (RLS denies; only service-role server code after verified payment events).

## 5. Proposed API routes

Auth: handled by Supabase (`/auth/callback`, sign-out action).

| Route | Method | Guard |
|---|---|---|
| `/api/chat` | POST (stream) | user + Free limit |
| `/api/conversations`, `/api/conversations/[id]` | GET/DELETE | owner |
| `/api/entitlements` | GET | user |
| `/api/resources`, `/api/crisis-contacts` | GET | public |
| `/api/providers`, `/api/providers/[id]` | GET | Plus (peer) / Pro (professional) |
| `/api/providers/[id]/availability` | GET | entitled user |
| `/api/bookings` | POST/GET | entitled user |
| `/api/bookings/[id]` | PATCH (reschedule/cancel) | participant + policy |
| `/api/bookings/[id]/call-token` | POST | participant, valid window |
| `/api/provider/profile`, `/availability`, `/bookings` | CRUD | provider role |
| `/api/provider/apply` | POST | user |
| `/api/billing/checkout` | POST | user |
| `/api/webhooks/paystack` | POST | HMAC signature verified, idempotent |
| `/api/admin/*` (users, providers, plans, resources, crisis, audit) | CRUD | admin, audited |

## 6. Phased plan

Follows the spec's 11 phases. Each phase ends with lint, type-check, tests, build, and a verification review before the next starts.

1. Architecture, repo setup, design system (this document + scaffold)
2. Landing, auth pages, dashboard, nav
3. Schema, RLS, roles, entitlements
4. AI chat + protected API
5. Voice + accessibility
6. Provider directory + verification
7. Booking + availability
8. Video (Daily)
9. Payments (Paystack, test mode)
10. Admin, safety resources
11. Tests, security/a11y review, deployment prep

## 7. Environment variables and external services

| Variable | Service | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | public (anon, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | **server only** |
| `ANTHROPIC_API_KEY` | Anthropic | **server only** |
| `DAILY_API_KEY` | Daily | **server only** |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET` | Paystack | **server only** |
| `NEXT_PUBLIC_APP_URL` | — | public |

Set these in Vercel → Project → Settings → Environment Variables (Preview and Production separately; use Paystack test keys for Preview). Missing keys ⇒ honest setup message or labelled demo mode, never a fake "live" feature.

## 8. Main risks

Security
- Privilege escalation via plan/role confusion → separate tables, RLS deny-by-default, tests.
- Prompt injection making the AI call tools beyond the user's rights → tools take the authenticated user from the session, never from model output; validate all inputs.
- Forged payment webhooks → signature verification, server-side verify, idempotency table.
- Double booking / race conditions → DB exclusion constraint.
- Unauthorised video room access → short-lived tokens, booking-status and time-window checks.
- Service-role key leaking into client bundles → `server-only` imports, CI grep check.

Mental-health safety
- Missed crisis signals → crisis detection layer plus model instruction; always-visible help link; verified contacts only.
- AI implying diagnosis or care → system prompt, output checks, persistent disclaimers.
- Provider misrepresentation → verification workflow before "verified" badge; peers never labelled as clinicians.
- Sensitive-data exposure → minimal collection, owner-only chats, retention and deletion policy.
- Fabricated emergency numbers → only admin-verified contacts are displayed or spoken.
- **Professional clinical and legal review (including Nigerian data-protection law, NDPA 2023) is required before launch.**

## 9. Decisions needing your approval

1. Who are the first human providers (peers, mentors, counsellors, psychologists)?
2. Who verifies qualifications and handles complaints/safeguarding?
3. What does Plus include: monthly call quota, booking access, or pay-per-call?
4. Pro: booking features only, consultation fees paid separately (recommended)?
5. Who owns urgent-safety escalation and clinical oversight?
6. Initial NGN price points (placeholders until costs are measured).
7. Chat retention period (suggest 30 days default, user-deletable).
8. Launch scope: ship Free first, then Plus, then Pro? (recommended)
9. Confirm stack choices: Supabase, Daily, Paystack, browser speech APIs for MVP.
