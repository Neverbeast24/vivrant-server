import type { Metadata } from "next";
import { GymPlansView } from "@/components/dashboard/gym-parts";
import { loadGymData } from "@/app/dashboard/gym/data";

export const metadata: Metadata = { title: "Gym Plans" };

export default async function GymPlansPage() {
  const data = await loadGymData();
  return <GymPlansView plans={data.plans} exercises={data.exercises} />;
}
