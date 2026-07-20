"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, ShieldBan, ShieldCheck } from "lucide-react";
import { ROLE_LABELS, type Profile, type UserRole, type UserStatus } from "@/lib/types";
import { updateUserRole, updateUserStatus } from "./actions";

export function UsersTable({
  users,
  canManageRoles,
  viewerRole,
}: {
  users: Profile[];
  canManageRoles: boolean;
  viewerRole: UserRole;
}) {
  const viewerIsSuper = viewerRole === "super_admin";

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[#14221b]/8 bg-[#f6faf7]/85 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[#14221b]/8 bg-[#e8efe9]/70 text-xs font-black tracking-wide text-[#6f8077]">
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
            {users.map((user) => {
              const targetIsSuper = user.role === "super_admin";
              const canEditThisRole = canManageRoles && (viewerIsSuper || !targetIsSuper);
              const canEditThisStatus = viewerIsSuper || !targetIsSuper;

              return (
                <tr key={user.user_id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-4 font-mono text-[11px] text-[#7a8a81]">
                    {user.user_id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-4 font-bold">{user.display_name}</td>
                  <td className="px-5 py-4 text-[#55665d]">{user.email ?? "—"}</td>
                  <td className="px-5 py-4">
                    <RoleSelect
                      key={`${user.user_id}-role-${user.role}`}
                      userId={user.user_id}
                      role={user.role}
                      canManage={canEditThisRole}
                      allowSuperAdmin={viewerIsSuper}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <StatusSelect
                      key={`${user.user_id}-status-${user.status}`}
                      userId={user.user_id}
                      status={user.status}
                      canManage={canEditThisStatus}
                    />
                  </td>
                  <td className="px-5 py-4 text-[#6f8077]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <UserActions user={user} canManageStatus={canEditThisStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserActions({
  user,
  canManageStatus,
}: {
  user: Profile;
  canManageStatus: boolean;
}) {
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
        className="focus-ring inline-flex items-center gap-1 rounded-lg border border-[#14221b]/10 bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-[#0e7c66] transition hover:bg-[#d7efe6]"
      >
        <Copy size={12} /> ID
      </button>
      <button
        type="button"
        disabled={pending || !canManageStatus}
        title={canManageStatus ? undefined : "Only Super Admin can change this account"}
        onClick={() => {
          start(async () => {
            const result = await updateUserStatus(user.user_id, nextStatus);
            if (result.ok) toast.success(result.message);
            else toast.error(result.message);
          });
        }}
        className={`focus-ring inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition disabled:opacity-60 ${
          nextStatus === "suspended"
            ? "border-[#c45c2a]/20 bg-[#f8ece4] text-[#a84b22] hover:bg-[#ffe4d4]"
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
  allowSuperAdmin,
}: {
  userId: string;
  role: UserRole;
  canManage: boolean;
  allowSuperAdmin: boolean;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(role);

  const roleOptions = Object.entries(ROLE_LABELS).filter(
    ([optionValue]) => allowSuperAdmin || optionValue !== "super_admin" || optionValue === role,
  );

  return (
    <select
      disabled={pending || !canManage}
      title={canManage ? "Change role" : "Only Super Admin can change roles"}
      value={value}
      onChange={(event) => {
        const previous = value;
        const next = event.target.value as UserRole;
        setValue(next);
        start(async () => {
          const result = await updateUserRole(userId, next);
          if (result.ok) toast.success(result.message);
          else {
            setValue(previous);
            toast.error(result.message);
          }
        });
      }}
      className="rounded-xl border border-[#14221b]/10 bg-[#e8efe9]/70 px-2 py-1.5 text-xs font-bold outline-none focus:border-[#0e7c66]/45"
    >
      {roleOptions.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

function StatusSelect({
  userId,
  status,
  canManage,
}: {
  userId: string;
  status: UserStatus;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(status);

  return (
    <select
      disabled={pending || !canManage}
      title={canManage ? "Change status" : "Only Super Admin can change this account"}
      value={value}
      onChange={(event) => {
        const previous = value;
        const next = event.target.value as UserStatus;
        setValue(next);
        start(async () => {
          const result = await updateUserStatus(userId, next);
          if (result.ok) toast.success(result.message);
          else {
            setValue(previous);
            toast.error(result.message);
          }
        });
      }}
      className="rounded-xl border border-[#14221b]/10 bg-[#e8efe9]/70 px-2 py-1.5 text-xs font-bold capitalize outline-none focus:border-[#0e7c66]/45"
    >
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
    </select>
  );
}
