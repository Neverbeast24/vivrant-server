"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { broadcastNotification } from "@/app/admin/settings/actions";
import { PrimaryButton } from "@/components/dashboard/ui";

export function BroadcastForm({
  members,
}: {
  members: { user_id: string; display_name: string; email: string | null }[];
}) {
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      const result = await broadcastNotification(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <form
      action={onSubmit}
      className="rounded-[1.4rem] border border-[#14221b]/8 bg-[#f6faf7] p-5 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold text-[#55665d]">
          Title
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Weekly reminder"
            className="mt-1.5 w-full rounded-xl border border-[#14221b]/10 bg-white px-3 py-2.5 text-sm font-semibold text-[#1e2f26]"
          />
        </label>
        <label className="block text-xs font-bold text-[#55665d]">
          Audience
          <select
            name="target"
            defaultValue="all"
            className="mt-1.5 w-full rounded-xl border border-[#14221b]/10 bg-white px-3 py-2.5 text-sm font-semibold text-[#1e2f26]"
          >
            <option value="all">All active members</option>
            <option value="one">One member</option>
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs font-bold text-[#55665d]">
        Message
        <textarea
          name="body"
          required
          maxLength={500}
          rows={3}
          placeholder="Keep logging meals and movement this week…"
          className="mt-1.5 w-full rounded-xl border border-[#14221b]/10 bg-white px-3 py-2.5 text-sm font-semibold text-[#1e2f26]"
        />
      </label>
      <label className="mt-3 block text-xs font-bold text-[#55665d]">
        Member (if one)
        <select
          name="user_id"
          defaultValue=""
          className="mt-1.5 w-full rounded-xl border border-[#14221b]/10 bg-white px-3 py-2.5 text-sm font-semibold text-[#1e2f26]"
        >
          <option value="">Select member…</option>
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.display_name}
              {member.email ? ` · ${member.email}` : ""}
            </option>
          ))}
        </select>
      </label>
      <PrimaryButton type="submit" disabled={pending} className="mt-4 rounded-full px-5">
        {pending ? "Sending…" : "Send notification"}
      </PrimaryButton>
    </form>
  );
}
