import type { Metadata } from "next";
import { AdminInquiriesView, type AdminInquiry } from "@/components/admin/inquiries";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inquiries" };

export default async function AdminInquiriesPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("contact_inquiries")
    .select(
      "id, plan, name, email, organization, message, status, admin_note, quoted_price, price_emailed_at, user_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return <AdminInquiriesView inquiries={(data ?? []) as AdminInquiry[]} />;
}
