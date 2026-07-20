# VIVRΛNT Web Master Documentation

This is the initial master documentation.

## Roles
- Super Admin
- Admin
- User

## Modules
- Authentication
- Dashboard
- User Management
- Roles & Permissions
- Nutrition
- Workout
- Expenses
- Grocery
- Pantry
- AI Decision Engine
- Reports
- Notifications
- Audit Logs
- Settings

## Recommended Libraries
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Auth.js
- Zod
- React Hook Form
- TanStack Query
- TanStack Table
- Framer Motion
- Recharts
- Sonner
- Lucide React
- cmdk
- dnd-kit
- next-themes

## Example User Table

|Column|Description|
|---|---|
|ID|Primary Key|
|Name|Full Name|
|Email|Email Address|
|Role|Assigned Role|
|Status|Active/Suspended|
|Created|Creation Date|
|Actions|CRUD|

## Implementation Notes (VIVRΛNT Web)

- **Data layer:** Supabase Postgres + RLS (project `gcqbuccazplfpmuhperg`)
- **Auth:** Supabase Auth (email, Google, GitHub)
- **Roles:** `profiles.role` → `user` | `admin` | `super_admin`
- **Admin routes:** `/admin/*` (staff only)
- **User routes:** `/dashboard/*`
