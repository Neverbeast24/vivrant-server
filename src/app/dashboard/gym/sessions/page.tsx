import type { Metadata } from "next";
import { GymSessionsView } from "@/components/dashboard/gym-parts";
import { loadGymData } from "@/app/dashboard/gym/data";

export const metadata: Metadata = { title: "Gym Sessions" };

export default async function GymSessionsPage() {
  const data = await loadGymData();
  return <GymSessionsView sessions={data.sessions} />;
}
