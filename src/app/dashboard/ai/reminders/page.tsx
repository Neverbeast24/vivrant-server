import type { Metadata } from "next";
import { AiView } from "@/components/dashboard/ai";

export const metadata: Metadata = { title: "AI Reminders" };

export default function AiRemindersPage() {
  return <AiView insights={[]} section="reminders" />;
}
