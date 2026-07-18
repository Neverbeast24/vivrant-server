export type UserRole = "user" | "admin" | "super_admin";
export type UserStatus = "active" | "suspended";

export type Profile = {
  user_id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const MODULES = [
  "Authentication",
  "Dashboard",
  "User Management",
  "Roles & Permissions",
  "Nutrition",
  "Workout",
  "Expenses",
  "Grocery",
  "Pantry",
  "AI Decision Engine",
  "Reports",
  "Notifications",
  "Audit Logs",
  "Settings",
] as const;
