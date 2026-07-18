import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [users, logs, meals, workouts, admins, suspended, recentLogs, recentUsers] =
    await Promise.all([
      supabase.from("profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("audit_logs").select("id", { count: "exact", head: true }),
      supabase.from("nutrition_logs").select("id", { count: "exact", head: true }),
      supabase.from("workout_logs").select("id", { count: "exact", head: true }),
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
        .select("id, action, entity, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("profiles")
        .select("user_id, display_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const stats = [
    ["Users", users.count ?? 0, `${admins.count ?? 0} staff · ${suspended.count ?? 0} suspended`],
    ["Audit events", logs.count ?? 0, "All time"],
    ["Meals logged", meals.count ?? 0, "Across all members"],
    ["Workouts logged", workouts.count ?? 0, "Across all members"],
  ] as const;

  return (
    <>
      <p className="text-[11px] font-black tracking-[0.2em] text-[#5f45e6]">ADMIN</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">VIVA control center</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#77727f]">
        Manage users, roles, permissions, and platform activity from one place.
      </p>

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
                  <p className="mt-0.5 text-xs text-[#847f8c]">{log.entity}</p>
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
            {(recentUsers.data ?? []).map((profile) => (
              <div
                key={profile.user_id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#26222f]/6 bg-[#f4efe4]/45 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{profile.display_name}</p>
                  <p className="mt-0.5 text-xs capitalize text-[#847f8c]">
                    {String(profile.role).replace("_", " ")}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-[#a19ca7]">
                  {new Date(profile.created_at).toLocaleDateString()}
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
