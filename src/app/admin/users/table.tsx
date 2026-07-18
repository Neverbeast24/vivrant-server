"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Copy, ShieldBan, ShieldCheck } from "lucide-react";
import { ROLE_LABELS, type Profile, type UserRole, type UserStatus } from "@/lib/types";
import { updateUserRole, updateUserStatus } from "./actions";

export function UsersTable({
  users,
  canManageRoles,
}: {
  users: Profile[];
  canManageRoles: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[#26222f]/8 bg-[#fdfbf4]/85 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#26222f]/8 bg-[#f4efe4]/70 text-xs font-black tracking-wide text-[#8a8491]">
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
                  <RoleSelect
                    userId={user.user_id}
                    role={user.role}
                    canManage={canManageRoles}
                  />
                </td>
                <td className="px-5 py-4">
                  <StatusSelect userId={user.user_id} status={user.status} />
                </td>
                <td className="px-5 py-4 text-[#8a8491]">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <UserActions user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserActions({ user }: { user: Profile }) {
  const [pending, start] = useTransition();
  const nextStatus: UserStatus = user.status === "active" ? "suspended" : "active";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title="Copy user ID"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(user.user_id);
            toast.success("User ID copied");
          } catch {
            toast.error("Could not copy user ID");
          }
        }}
        className="focus-ring inline-flex items-center gap-1 rounded-lg border border-[#26222f]/10 bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-[#5f45e6] transition hover:bg-[#ece7fb]"
      >
        <Copy size={12} /> ID
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const result = await updateUserStatus(user.user_id, nextStatus);
            if (result.ok) toast.success(result.message);
            else toast.error(result.message);
          });
        }}
        className={`focus-ring inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition disabled:opacity-60 ${
          nextStatus === "suspended"
            ? "border-[#e4571f]/20 bg-[#fff0e8] text-[#c24a1a] hover:bg-[#ffe4d4]"
            : "border-[#26bea9]/25 bg-[#e6faf6] text-[#0f8f80] hover:bg-[#d7f5ef]"
        }`}
      >
        {nextStatus === "suspended" ? <ShieldBan size={12} /> : <ShieldCheck size={12} />}
        {nextStatus === "suspended" ? "Suspend" : "Activate"}
      </button>
    </div>
  );
}

function RoleSelect({
  userId,
  role,
  canManage,
}: {
  userId: string;
  role: UserRole;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <select
      disabled={pending || !canManage}
      title={canManage ? "Change role" : "Only Super Admin can change roles"}
      defaultValue={role}
      onChange={(event) => {
        const next = event.target.value as UserRole;
        start(async () => {
          const result = await updateUserRole(userId, next);
          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
        });
      }}
      className="rounded-xl border border-[#26222f]/10 bg-[#f4efe4]/70 px-2 py-1.5 text-xs font-bold outline-none focus:border-[#5f45e6]/45"
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
      className="rounded-xl border border-[#26222f]/10 bg-[#f4efe4]/70 px-2 py-1.5 text-xs font-bold capitalize outline-none focus:border-[#5f45e6]/45"
    >
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
    </select>
  );
}
