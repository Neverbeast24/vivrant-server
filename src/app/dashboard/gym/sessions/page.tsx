import { redirect } from "next/navigation";

/** Sessions duplicated Log workout (same program runner). Keep the old URL working. */
export default function GymSessionsPage() {
  redirect("/dashboard/movement/log");
}
