# VIVRΛNT Complete Product Documentation

**Last updated:** 20 August 2026  
**Audience:** developers, testers, and maintainers of the web and mobile apps  
**Brand:** VIVRΛNT · *Long live life* · *Every Choice Shapes Your Health.*

This document is the current product baseline for **both** VIVRΛNT Web and VIVRΛNT Mobile. It replaces the outdated notes in [`VIVA_Web_Master_Documentation.md`](./VIVA_Web_Master_Documentation.md). Setup walkthroughs stay in [`SETUP.md`](../SETUP.md) and [`NOTIFICATIONS.md`](../NOTIFICATIONS.md). The Flutter REST contract is also listed in [`vivrant-mobile/docs/MOBILE_API_SPEC.md`](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/MOBILE_API_SPEC.md).

---

## 1. What VIVRΛNT is

VIVRΛNT (stylized from *vibrant*) is a personal wellness platform. The lambda (**Λ**) is a brand stylization of the letter A. Former working name: **VIVA** (Virtual Intelligent Vitality Assistant).

It helps people make healthier daily choices through logging **and** coaching — meals, movement, gym programs, sleep, hydration, mood, journal, habits, groceries, pantry, and wellness spending — plus Google Gemini coaching that stays on the server.

Two clients share one backend and one Postgres database:

| Client | Repo | Role |
|--------|------|------|
| **Web** | [vivrant-server](https://github.com/Neverbeast24/vivrant-server) (`viva-server` locally) | Next.js member dashboard, public site, admin console, Gemini, mobile REST API |
| **Mobile** | [vivrant-mobile](https://github.com/Neverbeast24/vivrant-mobile) | Flutter iOS / Android companion with member parity and a lighter admin surface |

Domain CRUD and Gemini calls **always** run on the web host. Flutter never embeds `GEMINI_API_KEY` or `SUPABASE_SECRET_KEY`.

---

## 2. Architecture

```text
Browser  ── cookie session ──►  Next.js 16 App Router (Vercel, region sin1)
                                  │
Flutter  ── Bearer JWT ──────────┤
                                  ├── Supabase Auth (email, Google, GitHub)
                                  ├── Supabase Postgres + Row Level Security
                                  ├── Server Actions (web dashboard / admin)
                                  ├── Route Handlers (/api/auth, /api/mobile, FCM, cron)
                                  ├── Google Gemini (server-only)
                                  ├── Firebase Storage (avatars / uploads)
                                  └── Firebase Cloud Messaging (web + native push)
```

**Web** uses Next.js Server Actions for most member and admin mutations, plus cookie sessions refreshed in `src/proxy.ts`.

**Mobile** uses JSON under `/api/auth/*`, `/api/mobile/**`, `/api/search`, and `/api/device-tokens`. Auth is `Authorization: Bearer <supabase_access_token>`. Suspended profiles receive `403`.

Shared source of truth: the same Supabase tables, Gemini helpers in `src/lib/ai/gemini.ts`, and archive/backup helpers in `src/lib/archive.ts` / `src/lib/backup.ts`.

---

## 3. Technology stack

### Web (`vivrant-server`)

| Layer | Choice |
|-------|--------|
| App | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4, Motion, Lucide, Sonner |
| Data | Supabase Postgres + RLS, `@supabase/ssr`, Zod |
| Auth | Supabase Auth (email / Google / GitHub) |
| AI | `@google/generative-ai` (Gemini; default model `gemini-3.1-flash-lite`) |
| Email | Nodemailer (Gmail SMTP) with optional Resend fallback |
| Storage / push | Firebase Storage + FCM (`firebase`, `firebase-admin`) |
| Hosting | Vercel (`sin1`) |
| Tests | Vitest, ESLint, `tsc --noEmit` |
| Node | **20.9+** |

Not in the live stack: Prisma, Auth.js, OpenAI.

### Mobile (`vivrant-mobile`)

| Layer | Choice |
|-------|--------|
| App | Flutter 3.35+ / Dart 3.9+ |
| State | Riverpod |
| Navigation | GoRouter |
| HTTP | Dio + Flutter Secure Storage (JWT) |
| Fonts | Space Grotesk, Bricolage Grotesque, Instrument Serif |
| Charts | fl_chart (via reports UI) |
| Push | Firebase Messaging → `POST /api/device-tokens` |
| Optional OAuth | `supabase_flutter` with redirect `io.supabase.vivrant://login-callback/` |

---

## 4. Roles and access

Stored on `profiles.role` and `profiles.status`.

| Role | Member dashboard | Admin console | Mobile admin |
|------|------------------|---------------|--------------|
| `user` | Yes | No | No |
| `admin` | Yes | Yes (users, tickets, roles, audit, system) | Same subset |
| `super_admin` | Yes | Admin + **Member activity** + **Inquiries** | Same |

| Status | Effect |
|--------|--------|
| `active` | Normal access |
| `suspended` | Blocked (`403` on mobile; staff can set this in Users) |

Staff helpers: `private.is_staff()` and `private.is_super_admin()` in Postgres; `requireStaff()` / `isSuperAdmin()` in `src/lib/auth/roles.ts`.

---

## 5. Authentication

### Web

- Email signup / login / forgot & reset password
- Google and GitHub OAuth via **Supabase** (provider secrets live only in the Supabase dashboard)
- Session refresh: `src/proxy.ts` → `updateSession`
- Confirm URL: `/auth/confirm`
- Change password: `POST /api/auth/change-password` (requires current password; min 8 characters)

### Mobile

1. `POST /api/auth/login` or `/signup` returns `access_token`, `refresh_token`, `expires_in`, `user`, `profile`
2. Tokens stored in Flutter Secure Storage
3. Subsequent calls send `Authorization: Bearer …`
4. `POST /api/mobile/auth/refresh` rotates tokens
5. `POST /api/mobile/auth/logout` — client always deletes local tokens
6. Idle timeout: **10 minutes** of no user activity (silent refresh does not extend the window); a stay-signed-in warning appears **90 seconds** before logout

Login also still sets cookies so the same host can serve the browser.

---

## 6. Public site (web)

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/about` | Product story |
| `/pricing` | Pricing |
| `/contact` | Contact / inquiry form |
| `/contact/sent` | Inquiry confirmation |
| `/login` | Sign in / sign up |
| `/reset-password` | Password reset UI |
| `/auth/confirm` | Email / OAuth confirm |

Contact inquiries land in `contact_inquiries` and are visible to **super_admin** at `/admin/inquiries`. SMTP sends acknowledgments and admin quotes when configured.

---

## 7. Member modules

Web navigation is `dashboardNav` in `src/lib/nav.ts`. Mobile mirrors the same modules: bottom tabs **Today · Nutrition · Move · Ask · More**, with the rest under **More**.

### 7.1 Today

| | Web | Mobile |
|--|-----|--------|
| Home | `/dashboard` | `/today` |
| Check-in | energy, mood, steps, water, sleep, note | same via `POST /api/mobile/today/checkin` |
| Pulse | calories, protein, steps, water, workout minutes, goals, unread notifications | `GET /api/mobile/today` |

### 7.2 Nutrition

| | Web | Mobile |
|--|-----|--------|
| Overview | `/dashboard/nutrition` | `/nutrition` |
| Log meal | `/dashboard/nutrition/log` | `/nutrition/log` |
| Sheet / easy entry | `/dashboard/nutrition/sheet` | Easy-entry paste + bulk API |
| Water | logged against today’s check-in | `POST /api/mobile/nutrition/water` |
| AI | estimate macros (text or photo), suggest a meal | `estimate`, `suggest` |

Meal types: `breakfast | lunch | dinner | snack`.

### 7.3 Training (activity + gym)

| | Web | Mobile |
|--|-----|--------|
| Hub | `/dashboard/training` | `/move` |
| Activity / log | `/dashboard/movement`, `/dashboard/movement/log` | `/move/activity`, `/move/log` |
| Gym hub | `/dashboard/gym` | `/gym` |
| Demos | `/dashboard/gym/demos` | `/gym/demos` |
| Machines | `/dashboard/gym/machines` | `/gym/machines` |
| Sessions + rest timer | `/dashboard/gym/sessions` | `/gym/sessions` |
| Saved programs | `/dashboard/gym/plans` | `/gym/plans` |

Gym extras that sync across clients:

- **Exercise catalog** (`gym_exercises`) — free weights, bodyweight, machines, demo videos
- **AI program builder** with drafts (`gym_program_drafts`) — cherry-pick days, then commit
- **Live session restore** (`gym_live_sessions`) — checks, rest timer, plan/day
- **AI machine recommendations**
- **Photo machine detector** — snap gym equipment, match the catalog, then add it to today, a program day, or known machines
- Reminder sync from the active gym plan (`POST /api/mobile/ai/reminders/sync-gym-plan`)

Activity types: `walk | run | strength | cycle | yoga | other`.  
Gym focus: `full_body | strength | fat_loss | mobility | endurance | upper | lower | core`.  
Plan levels: `beginner | intermediate | advanced`.

### 7.4 Wellness

| | Web | Mobile |
|--|-----|--------|
| Hub | `/dashboard/wellness` | `/wellness` |
| Sleep | `/dashboard/sleep` + sleep coach | `/sleep` |
| Hydration | `/dashboard/hydration` + reminder scheduling | `/hydration` |
| Mindfulness | `/dashboard/mindfulness` + mood + coach | `/mindfulness` |

### 7.5 Journal

Daily notes with optional mood/tags and an AI reflection (`reflectOnJournal` / `POST /api/mobile/journal/reflect`).

### 7.6 Habits

Daily habits with streaks (`habit_logs`), toggle-done-today, AI suggestions, and weekly **challenges** (`challenges` + `challenge_progress`).

Web: `/dashboard/habits`, `/dashboard/habits/add`, `/dashboard/habits/challenges`  
Mobile: `/habits`, `/habits/challenges`

### 7.7 Kitchen (groceries + pantry)

| | Web | Mobile |
|--|-----|--------|
| Hub | `/dashboard/kitchen` | `/kitchen` |
| Shopping | `/dashboard/groceries` | `/groceries` |
| Add / paste | `/dashboard/groceries/add` | Easy-entry paste |
| Sheet | `/dashboard/groceries/sheet` | Excel-style table widget |
| AI meal plan list | `/dashboard/groceries/plan` | `POST /api/mobile/groceries/plan` |
| Price insights | `/dashboard/groceries/insights` | `estimate-cost` |
| Pantry | `/dashboard/pantry` (+ items, categories, low-stock, add, sheet) | `/pantry`, `/pantry/add` |

Grocery categories: `produce | protein | dairy | grains | pantry | snacks | drinks | household | other`.  
Pantry categories: `vegetables | fruits | protein | dairy | grains | snacks | drinks | condiments | frozen | other`.  
**Low stock:** `stock_level ≤ 25`. Checked groceries can restock pantry; low-stock pantry items can be pushed to the grocery list.

Prices are PHP pesos. AI grocery estimates use a Philippines price catalog (`src/lib/groceries/ph-price-catalog.ts`).

### 7.8 Spending

Wellness budget on `profiles.monthly_health_budget`. Expense categories: `food | fitness | supplements | wellness | other`.

Web: overview, log, sheet, monthly budget.  
Mobile: `/spending`, `/spending/log`, `/spending/sheet`, `/spending/budget` + spending coach.

### 7.9 Reports

Weekly aggregates (calories, workouts, spend, check-ins) and an AI **weekly story**.

### 7.10 Ask VIVRΛNT

Chat (`ai_chat_messages`), saved insights (`ai_recommendations`), and scheduled reminders (`user_reminders`). Reminders can be drafted by AI, synced from leftover Today items, or synced from the gym plan. Vercel cron fires due reminders daily (see §16).

### 7.11 Profile & settings

Health profile (avatar, body stats, goals, water/step targets), health history with AI analysis, preferences (theme, notifications, weekly report, timezone), change password, and **Archived**.

Saved list order for groceries, pantry, habits, goals, and reminders lives in `user_settings.list_order` and syncs to mobile via `PATCH /api/mobile/settings/preferences`.

### 7.12 Archive

Deletes in member modules are **soft deletes**. The row gets `deleted_at`, a snapshot is stored in `archived_records`, and an internal backup row is written. Members restore from **Archived** (`/dashboard/archive` or `/profile/archive`). There is no member hard-delete; RLS blocks `DELETE` on those tables.

Members can also **download a JSON backup** of their account (`downloadMyBackup` / `GET /api/mobile/archive/export`).

Archivable entities: meals, workouts, expenses, pantry, groceries, goals, health history, gym sessions, gym plans, habits, challenges, journal notes, reminders.

### 7.13 Help

Member support tickets (`support_tickets`). Staff get in-app + push alerts; members get alerts when staff update a ticket.

---

## 8. Admin console

Web: `/admin/*` (staff only). Mobile: `/admin/*` for the same role, lighter UI.

| Path | Who | Purpose |
|------|-----|---------|
| `/admin` | admin+ | Overview counts |
| `/admin/users` | admin+ | Roles, status (active/suspended) |
| `/admin/tickets` | admin+ | Support inbox |
| `/admin/roles` | admin+ | Access model |
| `/admin/audit` | admin+ | Admin change history (`audit_logs`) |
| `/admin/settings` | admin+ | Service health + broadcast notification |
| `/admin/activity` | super_admin | Cross-member activity explorer |
| `/admin/inquiries` | super_admin | Marketing / contact requests |

Nav badges: open tickets, open inquiries (super_admin), missing Gemini / Firebase / email config.

---

## 9. Shared UX patterns (web + mobile)

These shipped together so logging is fast on both clients:

| Pattern | What it does |
|---------|----------------|
| **Easy entry / paste** | Paste a notepad or spreadsheet list (tabs, commas, or one name per line). Parser: `src/lib/lists/parse-quick-list.ts` and `lib/core/utils/parse_quick_list.dart`. |
| **Bulk APIs** | `POST /api/mobile/{nutrition/meals,groceries,pantry,spending/expenses}/bulk` |
| **Excel-style sheets** | Nutrition, groceries, pantry, spending — grid edit on web (`excel-sheet.tsx`) and Flutter (`excel_table.dart`) |
| **Confirm dialogs** | Destructive / restore actions ask first |
| **List reorder** | Drag/save order persisted in `user_settings.list_order` |

---

## 10. Data model (Supabase)

Project: **VIVA** · `gcqbuccazplfpmuhperg`. RLS is on for member tables. Super-admin read policies exist where staff dashboards need them.

### Identity & settings

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase Auth accounts |
| `profiles` | Display name, avatar, role, status, body stats, water/step goals, monthly budget, timezone |
| `user_settings` | Theme, notifications, weekly report, timezone, `list_order` |
| `device_tokens` | FCM tokens (`web \| android \| ios`) |

### Daily wellness

| Table | Purpose |
|-------|---------|
| `daily_checkins` | One row per user per date (energy, mood, steps, water, sleep) |
| `nutrition_logs` | Meals |
| `workout_logs` | Activity sessions |
| `health_goals` | Targets (`active \| completed \| paused`) |
| `health_history` | Weight / measurements over time |
| `habits` / `habit_logs` | Daily habits |
| `challenges` / `challenge_progress` | Weekly challenges |
| `journal_entries` | Journal |

### Gym

| Table | Purpose |
|-------|---------|
| `gym_exercises` | Demo catalog (seeded; videos/photos) |
| `gym_sessions` | Logged gym workouts |
| `gym_plans` | Saved AI / custom programs |
| `gym_program_drafts` | One draft per user (web ↔ mobile) |
| `gym_live_sessions` | In-progress session + rest timer (one per user) |

### Household

| Table | Purpose |
|-------|---------|
| `grocery_items` | Shopping list (`estimated_price` in PHP) |
| `pantry_items` | Stock 0–100 |
| `expenses` | Wellness spend |

### AI, comms, ops

| Table | Purpose |
|-------|---------|
| `ai_recommendations` | Saved insights |
| `ai_chat_messages` | Ask VIVRΛNT history |
| `user_reminders` | Scheduled nudges |
| `notifications` | In-app inbox |
| `support_tickets` | Member bugs / help |
| `contact_inquiries` | Public contact form |
| `audit_logs` | Staff / member audit (`actor_id`) |
| `archived_records` | Soft-delete snapshots |
| `internal_backups` | `kind`: `archive \| scheduled \| export` |

Schema lives in `supabase/schema.sql` plus dated migration files. Apply new SQL in the Supabase SQL editor (or CLI) in date order.

---

## 11. AI services (Gemini)

Implementation: `src/lib/ai/gemini.ts`. Context builder: `src/lib/ai/context.ts`. Key: `GEMINI_API_KEY` (server-only). Model: `GEMINI_MODEL` (prefer a stable id, not `gemini-flash-latest` at peak).

| Helper | Used for |
|--------|----------|
| `askViva` | Chat |
| `generateHealthInsight` | Insights |
| `estimateMealMacros` | Meal estimate (text / image) |
| `suggestMeal` | Meal suggestion |
| `suggestWorkout` | Activity suggestion |
| `generateGymPlan` | Training program |
| `recommendGymMachines` | Equipment picks |
| `planGroceriesFromPantry` | Smart grocery list |
| `estimateGroceryCostWithAi` | Item price range (PH) |
| `coachSpending` | Budget coach |
| `writeWeeklyStory` | Weekly narrative |
| `suggestGoals` | Goal ideas |
| `analyzeHealthHistory` | History insight |
| `draftReminder` | Reminder copy |
| `generateSleepCoach` | Sleep |
| `generateMindfulnessTip` | Mood / calm |
| `generateHabitSuggestions` | Habit ideas |
| `generateJournalReflection` | Journal |
| `summarizeMemberWeek` | Staff-oriented week summary |

Coaching is guidance, not medical advice. Formal scored “decision engine” APIs (Decision Score, Goal Alignment, Health Investment Index) are **product intent**, not a live REST product.

---

## 12. Notifications and email

Three layers (see [`NOTIFICATIONS.md`](../NOTIFICATIONS.md)):

1. **In-app inbox** — bell in dashboard / admin / mobile Notifications
2. **Web push (FCM)** — browsers; iOS Safari only as a Home Screen web app (iOS 16.4+)
3. **Native push** — Android / iOS register via `POST /api/device-tokens`

Triggers include: new support ticket (staff), ticket update (member), admin broadcasts, due reminders.

Email (Gmail SMTP preferred): inquiry auto-replies and admin quotes. Optional `RESEND_API_KEY`.

---

## 13. HTTP surface

### Auth & platform

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/login` | Cookies + JWT payload for mobile |
| POST | `/api/auth/signup` | Session tokens when confirmation is off |
| POST | `/api/auth/forgot-password` | |
| POST | `/api/auth/reset-password` | Recovery session |
| POST | `/api/auth/change-password` | Current + new password |
| GET | `/api/search?q=` | Cookie or Bearer |
| POST / DELETE | `/api/device-tokens` | FCM registration |
| GET | `/api/firebase-messaging-sw` | Service worker |
| GET | `/api/cron/reminders` | Daily 01:00 UTC — `Authorization: Bearer CRON_SECRET` |
| GET | `/api/cron/backup` | Daily 02:30 UTC — scheduled per-user dumps |

### Mobile REST (`/api/mobile/**`)

All require Bearer (or cookie fallback). Success: `{ "ok": true, … }`. Errors: `{ "error": "…" }` with `400 / 401 / 403 / 404 / 500`.

**Auth**  
`POST /auth/logout` · `POST /auth/refresh`

**Profile & today**  
`GET/PATCH /profile` · `POST/DELETE /profile/avatar` · `GET/PUT/PATCH /settings/preferences` · `GET /today` · `POST /today/checkin`

**Nutrition**  
`GET/POST /nutrition/meals` · `PATCH/DELETE /nutrition/meals/:id` · `POST /nutrition/meals/bulk` · `POST /nutrition/water` · `POST /nutrition/estimate` · `POST /nutrition/suggest`

**Movement**  
`GET/POST /movement/workouts` · `PATCH/DELETE /movement/workouts/:id` · `POST /movement/suggest`

**Gym**  
`GET /gym` · `GET /gym/exercises` · `GET/POST /gym/sessions` · `PATCH/DELETE /gym/sessions/:id` · `GET/PUT/DELETE /gym/sessions/live` · `GET /gym/plans` · `PATCH/DELETE /gym/plans/:id` · `POST /gym/plans/ai` · `GET/PUT/POST/DELETE /gym/plans/draft` · `POST /gym/plans/draft/commit` · `POST /gym/machines/recommend` · `POST /gym/machines/identify`

**Wellness**  
`POST /sleep` · `POST /sleep/coach` · `POST /hydration` · `POST /hydration/reminders` · `POST /mindfulness/mood` · `POST /mindfulness/coach`

**Journal & habits**  
`GET/POST /journal` · `PATCH/DELETE /journal/:id` · `POST /journal/reflect` · `GET/POST /habits` · `PATCH/DELETE /habits/:id` · `POST /habits/:id/toggle` · `POST /habits/suggest` · `GET/POST /habits/challenges` · `DELETE /habits/challenges/:id` · `POST /habits/challenges/refresh`

**Kitchen & spending**  
`GET/POST /groceries` · `PATCH/DELETE /groceries/:id` · `POST /groceries/bulk` · `POST /groceries/clear-completed` · `POST /groceries/restock-pantry` · `POST /groceries/plan` · `POST /groceries/plan/add` · `POST /groceries/estimate-cost` · `GET/POST /pantry` · `PATCH/DELETE /pantry/:id` · `POST /pantry/bulk` · `POST /pantry/low-stock-to-grocery` · `GET /spending` · `GET/POST /spending/expenses` · `PATCH/DELETE /spending/expenses/:id` · `POST /spending/expenses/bulk` · `PUT /spending/budget` · `POST /spending/coach`

**AI, goals, history, reports**  
`GET/POST /ai/chat` · `GET/POST /ai/insights` · `GET/POST /ai/reminders` · `PATCH/DELETE /ai/reminders/:id` · `POST /ai/reminders/draft` · `POST /ai/reminders/sync-gym-plan` · `POST /ai/reminders/sync-today` · `GET/POST /goals` · `PATCH/DELETE /goals/:id` · `POST /goals/refresh-progress` · `POST /goals/suggest` · `POST /goals/accept` · `GET/POST /health-history` · `DELETE /health-history/:id` · `POST /health-history/analyze` · `GET /reports` · `POST /reports/weekly-story`

**Inbox, support, archive**  
`GET /notifications` · `POST /notifications/:id/read` · `POST /notifications/read-all` · `GET/POST /support/tickets` · `GET/POST /archive` (list / restore) · `GET /archive/export`

**Staff** (`admin` / `super_admin`)  
`GET /admin/overview` · `GET /admin/users` · `PATCH /admin/users/:id` · `GET/PATCH /admin/tickets` · `GET /admin/roles` · `GET /admin/audit` · `GET/POST /admin/settings` · `GET /admin/activity` (super_admin) · `GET/PATCH /admin/inquiries` (super_admin)

IDs are JSON numbers. Timestamps are ISO-8601 UTC. Dates are `YYYY-MM-DD`. Money is PHP as numbers.

---

## 14. Web page catalog (member)

| Area | Routes |
|------|--------|
| Today | `/dashboard` |
| Nutrition | `/dashboard/nutrition`, `/log`, `/sheet` |
| Training | `/dashboard/training`, `/movement`, `/movement/log`, `/gym`, `/gym/demos`, `/gym/machines`, `/gym/sessions`, `/gym/plans` |
| Wellness | `/dashboard/wellness`, `/sleep`, `/hydration`, `/mindfulness` |
| Journal | `/dashboard/journal` |
| Habits | `/dashboard/habits`, `/habits/add`, `/habits/challenges` |
| Kitchen | `/dashboard/kitchen`, `/groceries`, `/groceries/add`, `/groceries/sheet`, `/groceries/plan`, `/groceries/insights`, `/pantry`, `/pantry/items`, `/pantry/sheet`, `/pantry/categories`, `/pantry/low-stock`, `/pantry/add` |
| Spending | `/dashboard/spending`, `/log`, `/sheet`, `/budget` |
| Reports | `/dashboard/reports` |
| AI | `/dashboard/ai`, `/ai/insights`, `/ai/reminders` |
| Profile | `/dashboard/settings`, `/settings/goals`, `/settings/history`, `/settings/preferences`, `/archive` |
| Help | `/dashboard/support` |

---

## 15. Mobile screen catalog

Unauthenticated: `/splash` → `/onboarding` (first launch) → `/login` · `/signup` · `/forgot-password`.

Shell tabs: `/today` · `/nutrition` (+ `/log`) · `/move` (+ `/activity`, `/log`) · `/ai` · `/more`.

Hubs and modules: `/wellness`, `/kitchen`, `/gym`, `/gym/demos`, `/gym/machines`, `/gym/sessions`, `/gym/plans`, `/sleep`, `/hydration`, `/mindfulness`, `/journal`, `/habits`, `/habits/challenges`, `/groceries`, `/pantry`, `/pantry/add`, `/spending`, `/spending/log`, `/spending/sheet`, `/spending/budget`, `/reports`, `/ai/insights`, `/ai/reminders`, `/profile`, `/profile/goals`, `/profile/history`, `/profile/archive`, `/profile/preferences`, `/profile/password`, `/support`, `/notifications`, `/search`.

Staff: `/admin`, `/admin/users`, `/admin/tickets`, `/admin/roles`, `/admin/audit`, `/admin/settings`, `/admin/activity`, `/admin/inquiries`.

Legacy redirects: `/movement` → `/move/activity`, `/training` → `/move`.

API mapping lives in `lib/data/api/*.dart` (auth, today, nutrition, movement, gym, wellness, household, AI, profile, admin).

---

## 16. Cron and backups

`vercel.json` (Singapore `sin1`):

| Schedule (UTC) | Path | Job |
|----------------|------|-----|
| `0 1 * * *` | `/api/cron/reminders` | Process due `user_reminders` (limit 200) |
| `30 2 * * *` | `/api/cron/backup` | Snapshot member data into `internal_backups` (`kind = scheduled`) |

Both require `Authorization: Bearer ${CRON_SECRET}` and return `503` if the secret is missing.

Free-tier Supabase has no PITR. Recovery paths are: restore from **Archived**, download a member **export**, or read `internal_backups`.

---

## 17. Environment (web)

Copy `.env.example` → `.env.local`. Important variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | Browser-safe key |
| `SUPABASE_SECRET_KEY` | Server login, admin client, cron backups |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Coaching |
| `NEXT_PUBLIC_FIREBASE_*` / `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web FCM |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server push (one-line JSON) |
| `NEXT_PUBLIC_APP_URL` | Site URL (local `http://localhost:3000`) |
| `SMTP_*` / `EMAIL_FROM` | Inquiry mail |
| `RESEND_API_KEY` | Optional email fallback |
| `CRON_SECRET` | Cron auth |

Never put Google/GitHub OAuth client secrets or `GEMINI_API_KEY` in `NEXT_PUBLIC_*` variables.

Full setup: [`SETUP.md`](../SETUP.md).

---

## 18. Local development

### Web

```bash
npm install
copy .env.example .env.local
npm run dev
```

Useful scripts: `npm run lint` · `npm run typecheck` · `npm run test` · `npm run qa` (typecheck + lint + tests) · `npm run qa:smoke`.

Do not run `npm run build` unless you explicitly need a production build.

### Mobile

Requires a running or deployed web host with the mobile REST routes.

```bash
flutter pub get
flutter run                                          # Android emulator → http://10.0.2.2:3000
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3000          # iOS simulator
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3000        # physical device on LAN
flutter run --dart-define=API_BASE_URL=https://your-app.vercel.app    # production
```

Release builds **must** use `https://` (`Env.apiBaseUrl` throws otherwise).

More: [`vivrant-mobile/README.md`](https://github.com/Neverbeast24/vivrant-mobile/blob/main/README.md) and [`docs/VIVRANT_Mobile_Documentation.md`](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/VIVRANT_Mobile_Documentation.md).

---

## 19. Security notes

- Member data is scoped by RLS (`auth.uid() = user_id`).
- Mobile JWT client uses the **publishable** key + Bearer; service role is only for restore/backup/admin operations that RLS cannot do.
- Suspended users are rejected in `requireMobileUser`.
- Soft-delete: no member `DELETE` policies on archivable tables.
- Cron and Firebase Admin secrets stay server-side.
- Flutter idle logout is 10 minutes of no interaction.
- Avatars: Firebase Storage / Supabase `avatars` bucket; upload via `POST /api/mobile/profile/avatar`.

---

## 20. Testing

Web: Vitest (security paths, reminder schedule, body metrics, mobile HTTP, pantry/list parsers, archive). `npm run qa` then `npm run qa:smoke` against production.

Mobile: `flutter test` / `flutter analyze`.

QA log: [`docs/QA_EVIDENCE.md`](./QA_EVIDENCE.md).

---

## 21. Project structure (web)

```text
src/
├── app/
│   ├── page.tsx, about/, pricing/, contact/, login/, reset-password/, auth/confirm/
│   ├── dashboard/          # member pages + Server Actions
│   ├── admin/              # staff console
│   └── api/
│       ├── auth/           # login, signup, password
│       ├── search/
│       ├── device-tokens/
│       ├── firebase-messaging-sw/
│       ├── cron/           # reminders, backup
│       └── mobile/         # Flutter REST catalog
├── components/dashboard/   # member UI (sheets, archive, gym, kitchen, …)
├── components/admin/
├── lib/
│   ├── ai/                 # Gemini + context
│   ├── archive.ts / archive-catalog.ts / backup.ts
│   ├── auth/ / firebase/ / supabase/ / mobile/
│   ├── groceries/ / gym.ts / lists/ / nav.ts / types.ts
└── proxy.ts
supabase/                   # schema.sql + dated migrations
docs/                       # this file, SETUP, notifications, QA
```

---

## 22. Related documents

| Doc | Purpose |
|-----|---------|
| [`README.md`](../README.md) | Web overview |
| [`SETUP.md`](../SETUP.md) | Local + Vercel + OAuth |
| [`NOTIFICATIONS.md`](../NOTIFICATIONS.md) | FCM |
| [`docs/QA_EVIDENCE.md`](./QA_EVIDENCE.md) | QA log |
| [`docs/VIVRANT_Complete_Project_Documentation_SDLC.docx`](./VIVRANT_Complete_Project_Documentation_SDLC.docx) | Academic SDLC pack |
| [Mobile README](https://github.com/Neverbeast24/vivrant-mobile/blob/main/README.md) | Flutter overview |
| [Mobile complete docs](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/VIVRANT_Mobile_Documentation.md) | Flutter deep dive |
| [Mobile API spec](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/MOBILE_API_SPEC.md) | REST contract |

---

## 23. Roadmap (not current)

- Formal Decision Engine score APIs
- OCR / receipt scanning and meal recognition
- Wearable integrations (Google Fit / Apple Health)
- Gamification, community challenges, family accounts
- Hard-delete / purge of archived items (restore + export exist today)

---

## License

Academic and research purposes.
