"use client";

import { useMemo, useState } from "react";
import { Activity, Search, UserRound } from "lucide-react";

export type MemberOption = {
  user_id: string;
  display_name: string;
  email: string | null;
};

export type ActivityRecord = {
  id: string;
  user_id: string;
  module: string;
  title: string;
  detail: string;
  value: string;
  timestamp: string;
};

const moduleLabels = [
  "all",
  "check-in",
  "nutrition",
  "movement",
  "spending",
  "groceries",
  "pantry",
  "AI",
] as const;

export function ActivityExplorer({
  members,
  records,
}: {
  members: MemberOption[];
  records: ActivityRecord[];
}) {
  const [query, setQuery] = useState("");
  const [memberId, setMemberId] = useState("all");
  const [module, setModule] = useState("all");

  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.user_id, member])),
    [members],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((record) => {
      const member = memberMap.get(record.user_id);
      const matchesMember = memberId === "all" || record.user_id === memberId;
      const matchesModule = module === "all" || record.module === module;
      const haystack =
        `${record.title} ${record.detail} ${record.value} ${member?.display_name ?? ""} ${member?.email ?? ""}`.toLowerCase();
      return matchesMember && matchesModule && (!normalized || haystack.includes(normalized));
    });
  }, [memberId, memberMap, module, query, records]);

  const distinctUsers = new Set(filtered.map((record) => record.user_id)).size;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Visible records", filtered.length, "Across selected modules"],
          ["Members", distinctUsers, "With matching activity"],
          ["Total members", members.length, "Registered profiles"],
        ].map(([label, value, detail]) => (
          <article
            key={String(label)}
            className="rounded-[1.4rem] border border-[#26222f]/8 bg-[#fdfbf4] p-5 shadow-[0_14px_32px_rgba(64,49,38,.07)]"
          >
            <p className="text-[11px] font-black uppercase tracking-wider text-[#8a8491]">
              {label}
            </p>
            <p className="font-display mt-3 text-4xl">{value}</p>
            <p className="mt-2 text-xs text-[#9a95a0]">{detail}</p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[1.5rem] border border-[#26222f]/8 bg-[#fdfbf4]/90 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_14rem_12rem]">
          <label className="flex items-center gap-2 rounded-xl border border-black/8 bg-[#f4efe4]/60 px-3">
            <Search size={15} className="text-[#8c8793]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members and logs…"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-black/8 bg-[#f4efe4]/60 px-3">
            <UserRound size={15} className="text-[#8c8793]" />
            <select
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
            >
              <option value="all">All members</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-black/8 bg-[#f4efe4]/60 px-3">
            <Activity size={15} className="text-[#8c8793]" />
            <select
              value={module}
              onChange={(event) => setModule(event.target.value)}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold capitalize outline-none"
            >
              {moduleLabels.map((label) => (
                <option key={label} value={label}>
                  {label === "all" ? "All modules" : label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#26222f]/8 bg-[#fdfbf4]/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-black/6 bg-[#f4efe4]/70 text-[10px] font-black uppercase tracking-wider text-[#8a8491]">
              <tr>
                <th className="px-5 py-4">Member</th>
                <th className="px-5 py-4">Module</th>
                <th className="px-5 py-4">Activity</th>
                <th className="px-5 py-4">Value</th>
                <th className="px-5 py-4">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const member = memberMap.get(record.user_id);
                return (
                  <tr key={record.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-bold">{member?.display_name ?? "Unknown member"}</p>
                      <p className="mt-0.5 text-[11px] text-[#918b96]">
                        {member?.email ?? record.user_id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#ece7fb] px-2.5 py-1 text-[10px] font-black capitalize text-[#5f45e6]">
                        {record.module}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold">{record.title}</p>
                      <p className="mt-0.5 max-w-md truncate text-xs text-[#847f8c]">
                        {record.detail}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-black">{record.value}</td>
                    <td className="px-5 py-4 text-xs text-[#847f8c]">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-[#9a95a0]">
                    No activity matches these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
