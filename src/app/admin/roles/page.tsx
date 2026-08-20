import { createClient } from "@/lib/supabase/server";
import { MODULES, ROLE_LABELS, type UserRole } from "@/lib/types";

const permissions = [
  { module: "User Management", user: "—", admin: "Read / Update status", super: "Full + roles" },
  { module: "Roles & Permissions", user: "—", admin: "Read", super: "Full" },
  { module: "Audit Logs", user: "—", admin: "Read", super: "Full" },
  { module: "Platform Settings", user: "—", admin: "Read + broadcast", super: "Full" },
  { module: "Member Activity", user: "—", admin: "—", super: "Full read" },
  { module: "Dashboard modules", user: "Own data", admin: "Own data", super: "Own + all members" },
  { module: "Gym / History / Goals", user: "Own data", admin: "Own data", super: "Own + all members" },
  { module: "AI Decision Engine", user: "Own insights", admin: "Own insights", super: "Own + member summaries" },
  { module: "Notifications", user: "Own inbox", admin: "Own + broadcast", super: "Own + broadcast" },
];

const roleDescriptions: Record<UserRole, string> = {
  user: "Access personal dashboard modules, gym, goals, health history, and own data only.",
  admin: "Manage member status, view audit logs, broadcast notices, and use the full personal dashboard.",
  super_admin: "Full platform control including roles, member activity explorer, and all module reports.",
};

export default async function AdminRolesPage() {
  const supabase = await createClient();
  const counts = await Promise.all(
    (Object.keys(ROLE_LABELS) as UserRole[]).map((role) =>
      supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", role),
    ),
  );
  const roleCounts = (Object.keys(ROLE_LABELS) as UserRole[]).map((role, index) => ({
    role,
    count: counts[index].count ?? 0,
  }));

  return (
    <>
      <h1 className="font-display text-4xl">Roles & Permissions</h1>
      <p className="mt-2 text-sm text-muted">
        VIVRΛNT supports three roles aligned with the master documentation.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {roleCounts.map(({ role, count }) => (
          <article
            key={role}
            className="rounded-[1.5rem] border border-ink/8 bg-card/85 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black tracking-wide text-accent">
                {ROLE_LABELS[role].toUpperCase()}
              </p>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-black text-accent">
                {count} {count === 1 ? "member" : "members"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{roleDescriptions[role]}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-ink/8 bg-card/85 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/8 bg-surface/70 text-xs font-black text-muted">
              <tr>
                <th className="px-5 py-4">Module</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Admin</th>
                <th className="px-5 py-4">Super Admin</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((row) => (
                <tr key={row.module} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-bold">{row.module}</td>
                  <td className="px-5 py-4">{row.user}</td>
                  <td className="px-5 py-4">{row.admin}</td>
                  <td className="px-5 py-4">{row.super}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-black tracking-wide text-muted">ALL MODULES</p>
        <div className="flex flex-wrap gap-2">
          {MODULES.map((module) => (
            <span
              key={module}
              className="rounded-full border border-ink/10 bg-surface/70 px-3 py-1.5 text-xs font-bold text-muted"
            >
              {module}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
