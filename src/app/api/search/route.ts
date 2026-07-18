import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  category: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const safeQuery = query.replace(/[^\p{L}\p{N}\s.'-]/gu, "");
  if (safeQuery.length < 2) return NextResponse.json({ results: [] });
  const pattern = `%${safeQuery}%`;
  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const isSuperAdmin = ownProfile?.role === "super_admin";
  const isStaff = ownProfile?.role === "admin" || isSuperAdmin;

  const [meals, workouts, groceries, pantry, expenses, insights, profiles] =
    await Promise.all([
      supabase
        .from("nutrition_logs")
        .select("id, meal_name, meal_type, user_id")
        .ilike("meal_name", pattern)
        .limit(5),
      supabase
        .from("workout_logs")
        .select("id, title, activity_type, user_id")
        .ilike("title", pattern)
        .limit(5),
      supabase
        .from("grocery_items")
        .select("id, name, quantity, user_id")
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("pantry_items")
        .select("id, name, category, user_id")
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("expenses")
        .select("id, title, category, user_id")
        .ilike("title", pattern)
        .limit(5),
      supabase
        .from("ai_recommendations")
        .select("id, title, body, user_id")
        .or(`title.ilike.${pattern},body.ilike.${pattern}`)
        .limit(5),
      isStaff
        ? supabase
            .from("profiles")
            .select("user_id, display_name, email")
            .or(`display_name.ilike.${pattern},email.ilike.${pattern}`)
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

  const memberHref = isSuperAdmin ? "/admin/activity" : "/dashboard";
  const results: SearchResult[] = [
    ...(profiles.data ?? []).map((row) => ({
      id: `profile-${row.user_id}`,
      label: row.display_name,
      detail: row.email ?? "Member profile",
      href: isSuperAdmin ? "/admin/activity" : "/admin/users",
      category: "Members",
    })),
    ...(meals.data ?? []).map((row) => ({
      id: `meal-${row.id}`,
      label: row.meal_name,
      detail: `${row.meal_type} meal`,
      href: row.user_id === user.id ? "/dashboard/nutrition" : memberHref,
      category: "Nutrition",
    })),
    ...(workouts.data ?? []).map((row) => ({
      id: `workout-${row.id}`,
      label: row.title,
      detail: `${row.activity_type} workout`,
      href: row.user_id === user.id ? "/dashboard/movement" : memberHref,
      category: "Movement",
    })),
    ...(groceries.data ?? []).map((row) => ({
      id: `grocery-${row.id}`,
      label: row.name,
      detail: row.quantity || "Grocery item",
      href: row.user_id === user.id ? "/dashboard/groceries" : memberHref,
      category: "Groceries",
    })),
    ...(pantry.data ?? []).map((row) => ({
      id: `pantry-${row.id}`,
      label: row.name,
      detail: `${row.category} pantry item`,
      href: row.user_id === user.id ? "/dashboard/pantry" : memberHref,
      category: "Pantry",
    })),
    ...(expenses.data ?? []).map((row) => ({
      id: `expense-${row.id}`,
      label: row.title,
      detail: `${row.category} expense`,
      href: row.user_id === user.id ? "/dashboard/spending" : memberHref,
      category: "Spending",
    })),
    ...(insights.data ?? []).map((row) => ({
      id: `insight-${row.id}`,
      label: row.title,
      detail: row.body,
      href: row.user_id === user.id ? "/dashboard/ai" : memberHref,
      category: "AI insights",
    })),
  ];

  return NextResponse.json({ results: results.slice(0, 24) });
}
