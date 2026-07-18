"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ROLE_LABELS, type Profile, type UserRole, type UserStatus } from "@/lib/types";
import { updateUserRole, updateUserStatus } from "./actions";

export function UsersTable({ users }: { users: Profile[] }) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white bg-white/75 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-black/5 bg-[#faf9fc] text-xs font-black tracking-wide text-[#8a8491]">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b border-black/5 last:border-0">
                <td className="px-5 py-4 font-mono text-[11px] text-[#9a95a0]">
                  {user.user_id.slice(0, 8)}…
                </td>
                <td className="px-5 py-4 font-bold">{user.display_name}</td>
                <td className="px-5 py-4 text-[#6f6b79]">{user.email ?? "—"}</td>
                <td className="px-5 py-4">
                  <RoleSelect userId={user.user_id} role={user.role} />
                </td>
                <td className="px-5 py-4">
                  <StatusSelect userId={user.user_id} status={user.status} />
                </td>
                <td className="px-5 py-4 text-[#8a8491]">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-xs font-bold text-[#7557ff]">Manage</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleSelect({ userId, role }: { userId: string; role: UserRole }) {
  const [pending, start] = useTransition();

  return (
    <select
      disabled={pending}
      defaultValue={role}
      onChange={(event) => {
        const next = event.target.value as UserRole;
        start(async () => {
          const result = await updateUserRole(userId, next);
          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
        });
      }}
      className="rounded-xl border border-black/8 bg-white px-2 py-1.5 text-xs font-bold"
    >
      {Object.entries(ROLE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function StatusSelect({ userId, status }: { userId: string; status: UserStatus }) {
  const [pending, start] = useTransition();

  return (
    <select
      disabled={pending}
      defaultValue={status}
      onChange={(event) => {
        const next = event.target.value as UserStatus;
        start(async () => {
          const result = await updateUserStatus(userId, next);
          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
        });
      }}
      className="rounded-xl border border-black/8 bg-white px-2 py-1.5 text-xs font-bold capitalize"
    >
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
    </select>
  );
}
