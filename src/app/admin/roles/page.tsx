import { MODULES, ROLE_LABELS } from "@/lib/types";

const permissions = [
  { module: "User Management", user: "—", admin: "Read/Update", super: "Full" },
  { module: "Roles & Permissions", user: "—", admin: "Read", super: "Full" },
  { module: "Audit Logs", user: "—", admin: "Read", super: "Full" },
  { module: "Dashboard modules", user: "Own data", admin: "Own data", super: "Own + admin" },
];

export default function AdminRolesPage() {
  return (
    <>
      <h1 className="font-display text-4xl">Roles & Permissions</h1>
      <p className="mt-2 text-sm text-[#77727f]">
        VIVA supports three roles aligned with the master documentation.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <article
            key={key}
            className="rounded-[1.5rem] border border-white bg-white/75 p-5 shadow-sm"
          >
            <p className="text-xs font-black tracking-wide text-[#7557ff]">{label.toUpperCase()}</p>
            <p className="mt-3 text-sm leading-6 text-[#6f6b79]">
              {key === "user" && "Access personal dashboard modules and own data only."}
              {key === "admin" && "Manage users, view audit logs, and support members."}
              {key === "super_admin" && "Full platform control including role assignment."}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-white bg-white/75 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-[#faf9fc] text-xs font-black text-[#8a8491]">
            <tr>
              <th className="px-5 py-4">Module</th>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Admin</th>
              <th className="px-5 py-4">Super Admin</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((row) => (
              <tr key={row.module} className="border-b border-black/5 last:border-0">
                <td className="px-5 py-4 font-bold">{row.module}</td>
                <td className="px-5 py-4">{row.user}</td>
                <td className="px-5 py-4">{row.admin}</td>
                <td className="px-5 py-4">{row.super}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-black tracking-wide text-[#8a8491]">ALL MODULES</p>
        <div className="flex flex-wrap gap-2">
          {MODULES.map((module) => (
            <span
              key={module}
              className="rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-xs font-bold text-[#5f5a67]"
            >
              {module}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
