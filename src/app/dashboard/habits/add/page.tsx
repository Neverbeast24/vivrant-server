import type { Metadata } from "next";
import { HabitsView } from "@/components/dashboard/habits";

export const metadata: Metadata = { title: "Add habit" };

export default function AddHabitPage() {
  return <HabitsView habits={[]} bestStreak={0} section="add" />;
}
