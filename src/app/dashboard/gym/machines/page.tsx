import type { Metadata } from "next";
import { GymMachinesView } from "@/components/dashboard/gym-parts";
import { loadGymData } from "@/app/dashboard/gym/data";

export const metadata: Metadata = { title: "Gym Machines" };

export default async function GymMachinesPage() {
  const data = await loadGymData();
  return <GymMachinesView exercises={data.exercises} />;
}
