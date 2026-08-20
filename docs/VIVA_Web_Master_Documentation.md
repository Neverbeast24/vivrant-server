# VIVRΛNT Web Master Documentation

**Status:** current baseline (20 August 2026)  
**Canonical doc:** [`VIVRANT_Complete_Documentation.md`](./VIVRANT_Complete_Documentation.md)

This file used to list an early scaffold (Prisma, Auth.js, shadcn-only). That stack is **not** what ships. Use the complete document above for architecture, modules, APIs, schema, AI, archive/backups, and mobile pairing.

---

## Roles

| Role | Access |
|------|--------|
| `user` | Member dashboard (`/dashboard/*`) |
| `admin` | Dashboard + admin console |
| `super_admin` | Admin + member activity + contact inquiries |

Stored on `profiles.role`. Status: `active` \| `suspended`.

---

## Live stack (not the old scaffold)

- **App:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- **Data:** Supabase Postgres + RLS (project `gcqbuccazplfpmuhperg`)
- **Auth:** Supabase Auth (email, Google, GitHub)
- **AI:** Google Gemini (`src/lib/ai/gemini.ts`) — not OpenAI
- **Push / storage:** Firebase Cloud Messaging + Storage
- **Mobile:** JSON REST under `/api/mobile/**` for Flutter
- **Hosting:** Vercel region `sin1`

Do **not** add Prisma or Auth.js for this product.

---

## Module map

Member: Today, Nutrition, Training (movement + gym), Wellness (sleep / hydration / mindfulness), Journal, Habits, Kitchen (groceries + pantry), Spending, Reports, Ask VIVRΛNT, Profile, Archive, Help.

Admin: Overview, Users, Tickets, Permissions, Audit, System. Super-admin: Member activity, Inquiries.

Public: Landing, About, Pricing, Contact.

---

## Companion app

Flutter iOS / Android: [vivrant-mobile](https://github.com/Neverbeast24/vivrant-mobile)  
Mobile docs: [VIVRANT_Mobile_Documentation.md](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/VIVRANT_Mobile_Documentation.md)  
REST contract: [MOBILE_API_SPEC.md](https://github.com/Neverbeast24/vivrant-mobile/blob/main/docs/MOBILE_API_SPEC.md)
