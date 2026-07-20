# VIVRΛNT setup guide

This project is a Next.js App Router app with:

- **Supabase** for Auth, Postgres, and RLS
- **Firebase** for Storage + Cloud Messaging
- **Vercel** for hosting

## Tools to install

You already have Node and Composer. Install these next:

| Tool | Why | Install |
| --- | --- | --- |
| **Node.js 20 LTS or newer** | Required by current Next.js | [nodejs.org](https://nodejs.org) |
| **Git** | Version control + Vercel Git imports | [git-scm.com](https://git-scm.com) |
| **VS Code / Cursor** | You already have Cursor | — |
| **Vercel CLI** (optional) | Local deploy + env pull | `npm i -g vercel` |
| **Supabase CLI** (optional) | Local migrations later | `npm i -g supabase` |
| **Firebase CLI** (optional) | Storage/FCM project helpers | `npm i -g firebase-tools` |

Do **not** install Prisma for this scaffold. Supabase is the database layer.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
copy .env.example .env.local
```

Fill in:

1. `NEXT_PUBLIC_SUPABASE_URL` — already set to your VIVA project URL
2. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase Dashboard → Project Settings → API Keys → **Publishable**
3. Firebase web config from Firebase Console → Project Settings → Your apps
4. Firebase Web Push certificate (VAPID) for Cloud Messaging

## 3. Supabase Auth settings

In the Supabase dashboard:

1. Authentication → URL Configuration
2. Site URL: `http://localhost:3000`
3. Add these Redirect URLs:
   - `http://localhost:3000/auth/confirm`
   - `http://192.168.254.118:3000/auth/confirm` when testing from another device
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/confirm` after deployment

The initial schema is already applied to project `VIVA` (`profiles`, `health_goals`, `daily_checkins`, `device_tokens`) with RLS enabled.

### Configure Google login

Supabase handles the OAuth exchange. Google must redirect to Supabase—not directly to the Next.js callback.

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select the VIVA project.
3. Open **Google Auth Platform** and configure the consent screen.
4. Add your email under **Test users** while the app is in testing mode.
5. Go to **Clients** → **Create client** → **Web application**.
6. Add this exact **Authorized redirect URI**:

   `https://gcqbuccazplfpmuhperg.supabase.co/auth/v1/callback`

7. Copy the Google Client ID and Client Secret.
8. In Supabase open **Authentication → Providers → Google**.
9. Enable Google, paste the Client ID and Client Secret, then save.

### Configure GitHub login

1. Open GitHub → **Settings → Developer settings → OAuth Apps**.
2. Select **New OAuth App**.
3. Use `VIVRΛNT` as the application name.
4. Homepage URL for local testing: `http://localhost:3000`.
5. Use this exact **Authorization callback URL**:

   `https://gcqbuccazplfpmuhperg.supabase.co/auth/v1/callback`

6. Register the app and generate a Client Secret.
7. In Supabase open **Authentication → Providers → GitHub**.
8. Enable GitHub, paste the Client ID and Client Secret, then save.

Never place Google or GitHub client secrets in `.env.local` or any `NEXT_PUBLIC_` variable. They belong only in the Supabase provider settings.

### How VIVRΛNT users are stored

1. Email, Google, and GitHub accounts are created in **Authentication → Users** (`auth.users`).
2. The database trigger creates a matching row in `public.profiles`.
3. OAuth names are read from `display_name`, `full_name`, or `name` metadata.
4. The dashboard reads the authenticated profile from Supabase.
5. RLS restricts profiles, goals, check-ins, and device tokens to their owner.

## 4. Run locally

```bash
npm run dev
```

Open:

- `/` landing
- `/login` auth
- `/dashboard` macOS-inspired wellbeing workspace

## 5. Connect Supabase + Vercel (step by step)

### A. Connect Supabase (local)

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) → project **VIVA**.
2. Go to **Project Settings → API Keys**.
3. Copy:
   - Project URL: `https://gcqbuccazplfpmuhperg.supabase.co`
   - **Publishable** key
4. Put them in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gcqbuccazplfpmuhperg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Go to **Authentication → URL Configuration**.
6. Set **Site URL** to:

```text
http://localhost:3000
```

7. Add **Redirect URLs**:

```text
http://localhost:3000/auth/confirm
```

8. Go to **Authentication → Providers**.
9. Keep **Email** enabled.
10. Optional: enable **Google** / **GitHub** (provider credentials stay in Supabase only).
11. Run:

```bash
npm run dev
```

12. Test at `http://localhost:3000/login`.
13. Confirm the user appears in Supabase → **Authentication → Users**.

### B. Deploy to Vercel

1. Push this repo to GitHub.
2. Open [vercel.com/new](https://vercel.com/new).
3. Import the `viva-server` repository.
4. Before deploy, open **Environment Variables** and add:

| Name | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://gcqbuccazplfpmuhperg.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your publishable key | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL, e.g. `https://viva-server.vercel.app` | Production |

5. Click **Deploy**.
6. Copy your live URL from Vercel (example: `https://viva-server.vercel.app`).

### C. Connect Vercel URL back to Supabase

1. Return to Supabase → **Authentication → URL Configuration**.
2. Change **Site URL** to your Vercel URL:

```text
https://YOUR-APP.vercel.app
```

3. Keep local redirects and also add production:

```text
http://localhost:3000/auth/confirm
https://YOUR-APP.vercel.app/auth/confirm
https://YOUR-APP.vercel.app/**
```

4. In Vercel, confirm `NEXT_PUBLIC_APP_URL` matches your live URL.
5. Redeploy Vercel once after changing env vars.
6. Open `https://YOUR-APP.vercel.app/login` and sign in.
7. Confirm the user appears again in Supabase → **Authentication → Users**.

### D. If Google / GitHub login is used in production

1. Keep the provider callback as Supabase:

```text
https://gcqbuccazplfpmuhperg.supabase.co/auth/v1/callback
```

2. In Google/GitHub app settings, you usually do **not** change that callback.
3. Just make sure Supabase Redirect URLs include your Vercel `/auth/confirm` URL.

Vercel auto-detects Next.js. `vercel.json` pins the Singapore region (`sin1`) for lower latency to the Philippines / Southeast Asia.

## Architecture note

- Supabase = source of truth for users + app data
- Firebase = storage uploads + push notifications
- Do not use Firebase Auth for this app unless you intentionally migrate away from Supabase Auth
