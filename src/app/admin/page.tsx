import Link from "next/link";
import { getCurrentProfile, isSuperAdmin } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();
  const superAdmin = isSuperAdmin(profile?.role as UserRole);

  const emptyCount = Promise.resolve({ count: null as number | null });

  const [
    users,
    logs,
    admins,
    suspended,
    recentLogs,
    recentUsers,
    meals,
    workouts,
    checkins,
    expenses,
    groceries,
    pantry,
    insights,
    gymSessions,
    gymPlans,
    history,
    goals,
  ] = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .in("role", ["admin", "super_admin"]),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "suspended"),
    supabase
      .from("audit_logs")
      .select("id, action, entity, actor_id, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("user_id, display_name, role, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    superAdmin
      ? supabase.from("nutrition_logs").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("workout_logs").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("daily_checkins").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("expenses").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("grocery_items").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("pantry_items").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("ai_recommendations").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("gym_sessions").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("gym_plans").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("health_history").select("id", { count: "exact", head: true })
      : emptyCount,
    superAdmin
      ? supabase.from("health_goals").select("id", { count: "exact", head: true })
      : emptyCount,
  ]);

  const actorIds = [...new Set((recentLogs.data ?? []).map((log) => log.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("user_id, display_name").in("user_id", actorIds)
    : { data: [] as { user_id: string; display_name: string }[] };
  const actorMap = new Map((actors ?? []).map((row) => [row.user_id, row.display_name]));

  const stats = [
    ["Users", users.count ?? 0, `${admins.count ?? 0} staff · ${suspended.count ?? 0} suspended`],
    ["Audit events", logs.count ?? 0, "All time"],
    ...(superAdmin
      ? ([
          ["Check-ins", checkins.count ?? 0, "Daily wellness logs"],
          ["Meals", meals.count ?? 0, "Nutrition across members"],
          ["Workouts", workouts.count ?? 0, "Movement logs"],
          ["Gym sessions", gymSessions.count ?? 0, "Strength training"],
          ["Gym plans", gymPlans.count ?? 0, "Saved programs"],
          ["Health history", history.count ?? 0, "Body measurements"],
          ["Goals", goals.count ?? 0, "Active + completed"],
          ["Expenses", expenses.count ?? 0, "Spending entries"],
          ["Groceries", groceries.count ?? 0, "List items"],
          ["Pantry", pantry.count ?? 0, "Stock items"],
          ["AI insights", insights.count ?? 0, "Recommendations"],
        ] as const)
      : ([
          ["Member activity", "—", "Super Admin only"],
          ["Platform roles", admins.count ?? 0, "Admins + Super Admins"],
        ] as const)),
  ] as const;

  return (
    <>
      <p className="text-[11px] font-black tracking-[0.2em] text-[#5f45e6]">ADMIN</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">VIVA control center</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77727f]">
        {superAdmin
          ? "Full platform visibility — every module count, audit trail, and member activity."
          : "Manage users, roles, permissions, and platform activity from one place."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {superAdmin ? (
          <>
            <Link
              href="/admin/activity"
              className="rounded-full bg-[#26222f] px-4 py-2 text-xs font-black text-white transition hover:bg-[#5f45e6]"
            >
              Open member activity
            </Link>
            <Link
              href="/admin/audit"
              className="rounded-full border border-[#26222f]/12 bg-white/70 px-4 py-2 text-xs font-black text-[#4c4757] transition hover:border-[#5f45e6]/30 hover:text-[#5f45e6]"
            >
              View audit logs
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/admin/users"
              className="rounded-full bg-[#26222f] px-4 py-2 text-xs font-black text-white transition hover:bg-[#5f45e6]"
            >
              Manage users
            </Link>
            <Link
              href="/admin/audit"
              className="rounded-full border border-[#26222f]/12 bg-white/70 px-4 py-2 text-xs font-black text-[#4c4757] transition hover:border-[#5f45e6]/30 hover:text-[#5f45e6]"
            >
              View audit logs
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-full border border-[#26222f]/12 bg-white/70 px-4 py-2 text-xs font-black text-[#4c4757] transition hover:border-[#5f45e6]/30 hover:text-[#5f45e6]"
            >
              Broadcast notice
            </Link>
          </>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, detail]) => (
          <article
            key={label}
            className="rounded-[1.4rem] border border-[#26222f]/8 bg-[#fdfbf4] p-5 shadow-[0_14px_32px_rgba(64,49,38,.07)]"
          >
            <p className="text-[11px] font-bold tracking-wide text-[#8a8491]">{label}</p>
            <p className="font-display mt-3 text-4xl leading-none tracking-tight">{value}</p>
            <p className="mt-2 text-xs font-semibold text-[#9a95a0]">{detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[1.4rem] border border-[#26222f]/8 bg-[#fdfbf4]/85 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Latest audit events</h2>
            <Link
              href="/admin/audit"
              className="text-xs font-black text-[#5f45e6] transition hover:opacity-70"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(recentLogs.data ?? []).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#26222f]/6 bg-[#f4efe4]/45 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{log.action}</p>
                  <p className="mt-0.5 text-xs text-[#847f8c]">
                    {log.entity}
                    {" · "}
                    {log.actor_id
                      ? (actorMap.get(log.actor_id) ?? `${String(log.actor_id).slice(0, 8)}…`)
                      : "system"}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-[#a19ca7]">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
            {!recentLogs.data?.length && (
              <p className="rounded-2xl border border-dashed border-[#26222f]/12 px-4 py-8 text-center text-sm text-[#9a95a0]">
                No audit events yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-[#26222f]/8 bg-[#fdfbf4]/85 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-tight">Newest members</h2>
            <Link
              href="/admin/users"
              className="text-xs font-black text-[#5f45e6] transition hover:opacity-70"
            >
              Manage users
            </Link>
          </div>
          <div className="space-y-2">
            {(recentUsers.data ?? []).map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#26222f]/6 bg-[#f4efe4]/45 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{member.display_name}</p>
                  <p className="mt-0.5 text-xs capitalize text-[#847f8c]">
                    {String(member.role).replace("_", " ")}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-[#a19ca7]">
                  {new Date(member.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {!recentUsers.data?.length && (
              <p className="rounded-2xl border border-dashed border-[#26222f]/12 px-4 py-8 text-center text-sm text-[#9a95a0]">
                No members yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
