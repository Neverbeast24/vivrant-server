import type { Metadata } from "next";
import { ActivityView } from "@/components/dashboard/activity";
import { listUserActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const { supabase, user } = await requireUser();
  const activity = await listUserActivity(supabase, user.id);

  return <ActivityView items={activity.items} />;
}
