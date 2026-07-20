import { requireStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAuditPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, entity, entity_id, actor_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(250);

  const actorIds = [...new Set((data ?? []).map((log) => log.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, display_name, email, role")
        .in("user_id", actorIds as string[])
    : { data: [] as { user_id: string; display_name: string; email: string | null; role: string }[] };

  const actorMap = new Map((actors ?? []).map((row) => [row.user_id, row]));

  return (
    <>
      <p className="text-[11px] font-black tracking-[0.2em] text-[#0e7c66]">ADMIN</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">Audit logs</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5a6b62]">
        Platform actions — role changes, status updates, avatar edits, and member-triggered events
        saved to Supabase.
      </p>

      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-[#14221b]/8 bg-[#f6faf7]/85 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#14221b]/8 bg-[#e8efe9]/70 text-xs font-black text-[#6f8077]">
              <tr>
                <th className="px-5 py-4">When</th>
                <th className="px-5 py-4">Actor</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Entity</th>
                <th className="px-5 py-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((log) => {
                const actor = log.actor_id ? actorMap.get(log.actor_id) : null;
                const meta =
                  log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
                    ? Object.entries(log.metadata as Record<string, unknown>)
                        .slice(0, 4)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(" · ")
                    : "";
                return (
                  <tr key={log.id} className="border-b border-black/5 last:border-0 align-top">
                    <td className="whitespace-nowrap px-5 py-4 text-[#6f8077]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold">{actor?.display_name ?? "Unknown"}</p>
                      <p className="mt-0.5 text-[11px] text-[#7a8a81]">
                        {actor?.email ?? (log.actor_id ? `${String(log.actor_id).slice(0, 8)}…` : "—")}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-bold">{log.action}</td>
                    <td className="px-5 py-4">
                      <p>{log.entity}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#7a8a81]">
                        {log.entity_id ?? "—"}
                      </p>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-xs leading-5 text-[#5a6b62]">
                      {meta || "—"}
                    </td>
                  </tr>
                );
              })}
              {!data?.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#7a8a81]">
                    No audit events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
