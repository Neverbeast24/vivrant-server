# VIVRΛNT Web

### Long live life

> **Every Choice Shapes Your Health.**

**VIVRΛNT** (stylized from *vibrant*) conveys energy, health, and vitality. It also carries **Viv**, from the Latin *vivere* (“to live”), which aligns with the product purpose. The lambda (**Λ**) is a brand stylization of the letter A. Former working name: VIVA (Virtual Intelligent Vitality Assistant).

VIVRΛNT Web is the Next.js platform for the VIVRΛNT ecosystem: member dashboard, admin console, AI coaching, and secure data services. It helps people make healthier daily choices through personalized recommendations—not tracking alone.

---

# About

VIVRΛNT Web includes:

- **Member workspace** — daily check-ins, nutrition, movement, gym, groceries, pantry, spending, reports, and AI coaching
- **Administrative console** — users, roles, audit logs, system settings, and (super-admin) member activity
- **Auth & data layer** — Supabase Auth + Postgres with Row Level Security
- **AI services** — Google Gemini coaching across modules
- **Push & storage** — Firebase Cloud Messaging and Firebase Storage

Domain logic runs mainly through **Next.js Server Actions** and App Router pages. A thin HTTP surface covers auth, search, and the FCM service worker. A full public REST API for Flutter mobile remains on the roadmap.

---

# Architecture

```text
Browser (Landing / Login / Dashboard / Admin)
              │
     Next.js 16 App Router (Vercel)
              │
 ├── Supabase Auth (email, Google, GitHub)
 ├── Supabase Postgres + RLS
 ├── Server Actions (domain + AI)
 ├── Route Handlers (auth, search, FCM SW)
 ├── Google Gemini
 ├── Firebase Storage
 └── Firebase Cloud Messaging

Planned:
Flutter Mobile ── REST API ── VIVRΛNT Web
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

## Today

- Daily check-in
- Live stats pulse
- Insight / coaching entry points

## Nutrition

- Meal overview and logging
- AI meal estimate (macros)

## Movement

- Activity overview and workout logging
- AI workout suggestions

## Gym

- Exercise demos (free weights & bodyweight)
- Machine demos and AI equipment picks
- Session logging and history
- AI training plans

## Groceries & Pantry

- Smart grocery lists
- Pantry inventory
- AI grocery planning helpers

## Spending

- Wellness budget tracking
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

## Admin Console

- Overview counts
- User management
- Roles & permissions
- Audit logs
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
│   │   ├── movement/
│   │   ├── gym/
│   │   ├── groceries/
│   │   ├── pantry/
│   │   ├── spending/
│   │   ├── reports/
│   │   ├── ai/
│   │   └── settings/
│   ├── admin/                   # Staff console
│   │   ├── users/
│   │   ├── roles/
│   │   ├── audit/
│   │   ├── activity/
│   │   └── settings/
│   └── api/
│       ├── auth/                # login, signup, forgot/reset password
│       ├── search/
│       └── firebase-messaging-sw/
├── components/
│   ├── brand.tsx
│   ├── landing-page.tsx
│   ├── dashboard/
│   └── admin/
├── hooks/
├── lib/
│   ├── ai/                      # Gemini + context
│   ├── auth/
│   ├── firebase/
│   ├── supabase/
│   ├── gym.ts
│   ├── nav.ts
│   └── types.ts
└── proxy.ts                     # Session refresh
supabase/
├── schema.sql
└── migrations/
docs/
└── VIVRANT_Complete_Project_Documentation_SDLC.docx
```

---

# HTTP Routes (current)

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/login`, `/signup`, `/forgot-password`, `/reset-password` |
| Search | `/api/search` |
| FCM | `/api/firebase-messaging-sw` |

Member and admin domain operations use **Server Actions** inside the App Router (not a full public REST catalog yet).

---

# Future Features

- Full mobile REST API surface for Flutter
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
| [SETUP.md](./SETUP.md) | Local setup, env, Supabase, Firebase, Vercel |
| [docs/VIVA_Web_Master_Documentation.md](./docs/VIVA_Web_Master_Documentation.md) | Master notes |
| [docs/VIVRANT_Complete_Project_Documentation_SDLC.docx](./docs/VIVRANT_Complete_Project_Documentation_SDLC.docx) | SDLC pack (Appendix E = current VIVRΛNT baseline) |

---

# License

Academic and research purposes.
