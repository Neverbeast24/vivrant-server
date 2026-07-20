import type { Metadata } from "next";
import { GymOverview } from "@/components/dashboard/gym-overview";
import { loadGymData } from "@/app/dashboard/gym/data";

export const metadata: Metadata = { title: "Gym" };

export default async function GymPage() {
  const data = await loadGymData();
  return (
    <GymOverview
      sessionCount={data.sessions.length}
      totalMinutes={data.totalMinutes}
      totalCalories={data.totalCalories}
      machineCount={data.machineCount}
      demoCount={data.demoCount}
      planCount={data.plans.length}
    />
  );
}
