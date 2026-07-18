import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [users, logs, meals, workouts] = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
    supabase.from("nutrition_logs").select("id", { count: "exact", head: true }),
    supabase.from("workout_logs").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    ["Users", users.count ?? 0],
    ["Audit events", logs.count ?? 0],
    ["Meals logged", meals.count ?? 0],
    ["Workouts logged", workouts.count ?? 0],
  ] as const;

  return (
    <>
      <p className="text-xs font-black tracking-[0.16em] text-[#7557ff]">ADMIN</p>
      <h1 className="font-display mt-2 text-4xl">VIVA control center</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77727f]">
        Manage users, roles, permissions, and platform activity from one place.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <article
            key={label}
            className="rounded-[1.5rem] border border-white bg-white/75 p-5 shadow-sm"
          >
            <p className="text-xs font-bold text-[#8a8491]">{label}</p>
            <p className="mt-3 text-3xl font-black">{value}</p>
          </article>
        ))}
      </div>
    </>
  );
}
