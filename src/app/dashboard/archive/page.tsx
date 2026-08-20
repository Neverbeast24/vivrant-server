import type { Metadata } from "next";
import { ArchiveView } from "@/components/dashboard/archive";
import { listArchivedRecords } from "@/lib/archive";
import { requireUser } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Archived" };

export default async function ArchivePage() {
  const { supabase, user } = await requireUser();
  const archived = await listArchivedRecords(supabase, user.id);

  return <ArchiveView items={archived.items} />;
}
