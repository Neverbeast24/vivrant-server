import type { Metadata } from "next";
import { WellnessHub } from "@/components/dashboard/wellness-hub";
import { loadWellnessPulse } from "@/app/dashboard/wellness/data";

export const metadata: Metadata = { title: "Wellness" };

export default async function WellnessPage() {
  const pulse = await loadWellnessPulse();
  return <WellnessHub pulse={pulse} />;
}
