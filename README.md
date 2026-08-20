# VIVRΛNT Web

### Long live life

> **Every Choice Shapes Your Health.**

**VIVRΛNT** (stylized from *vibrant*) conveys energy, health, and vitality. It also carries **Viv**, from the Latin *vivere* (“to live”), which aligns with the product purpose. The lambda (**Λ**) is a brand stylization of the letter A. Former working name: VIVA (Virtual Intelligent Vitality Assistant).

VIVRΛNT Web is the Next.js platform for the VIVRΛNT ecosystem: member dashboard, admin console, AI coaching, mobile REST API, and secure data services. It helps people make healthier daily choices through personalized recommendations—not tracking alone.

---

## Repositories

| Repo | Role |
|------|------|
| [vivrant-server](https://github.com/Neverbeast24/vivrant-server) (this) | Next.js web app, admin console, Supabase + Gemini, mobile REST API |
| [vivrant-mobile](https://github.com/Neverbeast24/vivrant-mobile) | Flutter iOS / Android companion |

---

# About

VIVRΛNT Web includes:

- **Member workspace** — daily check-ins, nutrition, training, wellness, journal, habits, kitchen (groceries & pantry), spending, reports, archive, support, and AI coaching
- **Administrative console** — users, roles, audit logs, system settings, tickets, and (super-admin) member activity
- **Auth & data layer** — Supabase Auth + Postgres with Row Level Security
- **AI services** — Google Gemini coaching across modules
- **Push & storage** — Firebase Cloud Messaging and Firebase Storage
- **Support tickets** — member bug reports with staff inbox + push alerts
- **Mobile REST API** — `/api/mobile/**` for the Flutter apps (see [vivrant-mobile](https://github.com/Neverbeast24/vivrant-mobile), [`docs/VIVRANT_Complete_Documentation.md`](./docs/VIVRANT_Complete_Documentation.md), and [`docs/MOBILE_API_SPEC.md`](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/MOBILE_API_SPEC.md))

Web domain logic runs mainly through **Next.js Server Actions** and App Router pages. Native Android/iOS apps use JSON routes under `/api/mobile/**`, plus auth, search, and device-token registration. Native apps register FCM tokens via `POST /api/device-tokens` (see [`NOTIFICATIONS.md`](./NOTIFICATIONS.md)).

---

# Architecture

```text
Browser (Landing / Login / Dashboard / Admin)
              │
     Next.js 16 App Router (Vercel)
              │
 ├── Supabase Auth (email, Google, GitHub)
 ├── Supabase Postgres + RLS
 ├── Server Actions (web domain + AI)
 ├── Route Handlers (auth, search, FCM SW, /api/mobile/**)
 ├── Google Gemini
 ├── Firebase Storage
 └── Firebase Cloud Messaging

Flutter iOS / Android ── REST (/api/auth, /api/mobile, /api/device-tokens) ── VIVRΛNT Web
```

---

# Roles

| Role | Access |
| --- | --- |
| `user` | Member dashboard |
| `admin` | Admin console (users, roles, audit, settings) |
| `super_admin` | Admin console + cross-member activity explorer |

---

# Core Modules

## Authentication

- Email signup / login / forgot & reset password
- Google and GitHub OAuth (via Supabase Auth)
- Session refresh (`src/proxy.ts`)
- Role-based access for `/dashboard` and `/admin`

## User & Profile

- Profiles and avatars
- Health goals
- Health history
- Preferences and account settings
- Archive — restore or permanently delete soft-deleted records

## Today

- Daily check-in
- Live stats pulse
- Insight / coaching entry points

## Nutrition

- Meal overview and logging
- Excel-style sheet view
- AI meal estimate (macros)

## Training (Movement & Gym)

- Activity overview and workout logging
- Exercise demos (free weights & bodyweight)
- Machine demos and AI equipment picks
- Session logging, saved programs, and live rest timers
- AI training plans

## Wellness

- Sleep logging and coach
- Hydration goals and reminders
- Mindfulness / mood check-ins

## Journal

- Daily notes and AI reflection

## Habits

- Daily habits and streaks
- Weekly challenges

## Kitchen (Groceries & Pantry)

- Kitchen hub (shopping list + pantry pulse)
- Smart grocery lists, including Excel-style sheet view
- Pantry inventory, categories, low-stock restock
- AI grocery planning helpers

## Spending

- Wellness budget tracking
- Expense log and sheet view
- Spending coach insights

## AI Engine

- Ask VIVRΛNT (chat)
- Insights and reminders
- Weekly story / narrative reports
- Cross-module coaching (meals, workouts, gym, spending, health history)

## Reports & Notifications

- Weekly patterns and trends
- Push notification path (FCM)
- Goal and reminder drafting

## Help

- Member support tickets

## Admin Console

- Overview counts
- User management
- Roles & permissions
- Audit logs
- Tickets and inquiries
- System settings / service health
- Member activity (super-admin)

---

# AI Services

**Current:** Google Gemini (`@google/generative-ai`)

Capabilities include:

- Recommendation generation and chat
- Nutrition / meal analysis
- Workout and gym plan suggestions
- Grocery and spending coaching
- Weekly stories and health-history analysis
- Reminder drafts

**Not current:** OpenAI (removed from active stack)

Formal scored indices (Decision Score, Goal Alignment Score, Health Investment Index, etc.) remain product intent; the live product delivers Gemini coaching and weekly narratives rather than a separate scored REST decision-engine API.

---

# Technology Stack

## Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Motion animations
- Lucide icons, Sonner toasts

## Backend & Data

- Next.js Route Handlers + Server Actions
- Supabase Postgres + Row Level Security
- Supabase Auth
- Zod validation

## Storage & Notifications

- Firebase Storage
- Firebase Cloud Messaging

## AI

- Google Gemini API

## Deployment

- Vercel

---

# Quick Start

See [SETUP.md](./SETUP.md) for tools, environment variables, Supabase, Firebase, OAuth, and Vercel.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Useful scripts:

```bash
npm run build
npm run lint
npm run typecheck
```

Requires **Node.js 20.9+**.

---

# Project Structure

```text
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── login/                   # Auth UI
│   ├── reset-password/
│   ├── auth/confirm/            # Email / OAuth confirm
│   ├── dashboard/               # Member workspace
│   │   ├── nutrition/
│   │   ├── training/            # Activity + gym hub
│   │   ├── movement/
│   │   ├── gym/
│   │   ├── wellness/            # Sleep, hydration, mindfulness
│   │   ├── journal/
│   │   ├── habits/
│   │   ├── kitchen/
│   │   ├── groceries/
│   │   ├── pantry/
│   │   ├── spending/
│   │   ├── reports/
│   │   ├── ai/
│   │   ├── archive/             # restore soft-deleted items + backup export
│   │   ├── support/
│   │   └── settings/
│   ├── admin/                   # Staff console
│   │   ├── users/
│   │   ├── tickets/
│   │   ├── roles/
│   │   ├── audit/
│   │   ├── settings/
│   │   ├── activity/            # super_admin
│   │   └── inquiries/           # super_admin
│   └── api/
│       ├── auth/                # login, signup, forgot/reset/change password
│       ├── search/
│       ├── device-tokens/
│       ├── cron/                # reminders + scheduled backups
│       ├── mobile/              # Flutter REST catalog
│       └── firebase-messaging-sw/
├── components/
│   ├── brand.tsx
│   ├── landing-page.tsx
│   ├── dashboard/
│   └── admin/
├── hooks/
├── lib/
│   ├── ai/                      # Gemini + context
│   ├── archive.ts / backup.ts   # soft-delete + member exports
│   ├── auth/
│   ├── firebase/
│   ├── supabase/
│   ├── gym.ts
│   ├── nav.ts
│   └── types.ts
└── proxy.ts                     # Session refresh
supabase/
├── schema.sql
└── *.sql                        # dated migrations
docs/
├── VIVRANT_Complete_Documentation.md
└── VIVRANT_Complete_Project_Documentation_SDLC.docx
```

---

# HTTP Routes (current)

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/login`, `/signup`, `/forgot-password`, `/reset-password`, `/change-password` |
| Search | `/api/search` |
| FCM | `/api/firebase-messaging-sw`, `POST`/`DELETE /api/device-tokens` |
| Cron | `/api/cron/reminders`, `/api/cron/backup` (Bearer `CRON_SECRET`) |
| Mobile | `/api/mobile/**` (member + admin JSON API for Flutter) |

Web member and admin pages still use **Server Actions**. Flutter uses the `/api/mobile/**` catalog documented in the [mobile API spec](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/MOBILE_API_SPEC.md).

---

# Future Features

- Formal Decision Engine score APIs
- OCR processing / receipt scanning
- Meal recognition
- Smart grocery engine upgrades
- Predictive health analysis
- Wearable integrations (Google Fit / Apple Health)
- Gamification, community challenges, family accounts

---

# Docs

| Doc | Purpose |
| --- | --- |
| [docs/VIVRANT_Complete_Documentation.md](./docs/VIVRANT_Complete_Documentation.md) | **Canonical** product docs (web + mobile, modules, schema, APIs, AI, archive) |
| [SETUP.md](./SETUP.md) | Local setup, env, Supabase, Firebase, Vercel |
| [NOTIFICATIONS.md](./NOTIFICATIONS.md) | FCM / device tokens |
| [docs/VIVA_Web_Master_Documentation.md](./docs/VIVA_Web_Master_Documentation.md) | Short master index |
| [docs/QA_EVIDENCE.md](./docs/QA_EVIDENCE.md) | QA log |
| [docs/VIVRANT_Complete_Project_Documentation_SDLC.docx](./docs/VIVRANT_Complete_Project_Documentation_SDLC.docx) | SDLC pack (Appendix E = current VIVRΛNT baseline) |
| [Mobile complete docs](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/VIVRANT_Mobile_Documentation.md) | Flutter deep dive |
| [Mobile API spec](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/MOBILE_API_SPEC.md) | REST contract consumed by Flutter |

---

# License

Academic and research purposes.
