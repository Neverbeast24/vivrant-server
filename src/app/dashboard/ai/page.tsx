import type { Metadata } from "next";
import { AiView } from "@/components/dashboard/ai";

export const metadata: Metadata = { title: "Ask VIVRΛNT" };

export default function AiPage() {
  return <AiView insights={[]} section="ask" />;
}
