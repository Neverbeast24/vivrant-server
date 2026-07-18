import { createClient } from "@/lib/supabase/server";

export default async function AdminAuditPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <h1 className="font-display text-4xl">Audit Logs</h1>
      <p className="mt-2 text-sm text-[#77727f]">
        Track administrative actions across the VIVA platform.
      </p>

      <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-white bg-white/75 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-[#faf9fc] text-xs font-black text-[#8a8491]">
            <tr>
              <th className="px-5 py-4">When</th>
              <th className="px-5 py-4">Action</th>
              <th className="px-5 py-4">Entity</th>
              <th className="px-5 py-4">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((log) => (
              <tr key={log.id} className="border-b border-black/5 last:border-0">
                <td className="px-5 py-4 text-[#8a8491]">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-4 font-bold">{log.action}</td>
                <td className="px-5 py-4">{log.entity}</td>
                <td className="px-5 py-4 font-mono text-[11px] text-[#9a95a0]">
                  {log.entity_id ?? "—"}
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-[#9a95a0]">
                  No audit events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
