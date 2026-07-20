import type { Metadata } from "next";
import { GymDemosView } from "@/components/dashboard/gym-parts";
import { loadGymData } from "@/app/dashboard/gym/data";

export const metadata: Metadata = { title: "Gym Demos" };

export default async function GymDemosPage() {
  const data = await loadGymData();
  return <GymDemosView exercises={data.exercises} />;
}
