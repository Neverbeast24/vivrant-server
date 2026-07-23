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
  birth_date: string | null;
  sex: "female" | "male" | "non_binary" | "prefer_not_to_say" | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active" | null;
  health_focus:
    | "general"
    | "weight"
    | "strength"
    | "endurance"
    | "nutrition"
    | "sleep"
    | "stress"
    | null;
  daily_step_goal: number;
  daily_water_goal_ml: number;
  monthly_health_budget: number;
  bio: string | null;
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
  "Movement",
  "Gym",
  "Sleep",
  "Hydration",
  "Mindfulness",
  "Journal",
  "Habits",
  "Challenges",
  "Health History",
  "Goals",
  "Expenses",
  "Grocery",
  "Pantry",
  "AI Decision Engine",
  "Reminders",
  "Reports",
  "Notifications",
  "Audit Logs",
  "Settings",
  "Member Activity",
] as const;
