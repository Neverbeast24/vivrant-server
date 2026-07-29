import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { recommendGymMachines } from "@/lib/ai/gemini";

export const runtime = "nodejs";

/** AI machine recommendations based on the catalog + user context. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  try {
    const [{ data: machines }, context] = await Promise.all([
      supabase
        .from("gym_exercises")
        .select("slug, name, muscle_group, equipment, difficulty, cues")
        .in("equipment", ["machine", "cable", "cardio_machine"])
        .order("name"),
      buildUserContext(user.id, { supabase }),
    ]);

    const catalog = (machines ?? [])
      .map(
        (row) =>
          `${row.name} | ${row.slug} | ${row.muscle_group} | ${row.equipment} | ${row.difficulty}`,
      )
      .join("\n");

    const recommendation = await recommendGymMachines(
      context,
      catalog ||
        "Leg press machine | leg-press | legs | machine | beginner\nLat pulldown machine | lat-pulldown | back | machine | beginner",
    );

    await writeAuditLog(
      {
        action: "gym_machines_recommended",
        entity: "gym_exercises",
        metadata: {
          title: recommendation.title,
          count: recommendation.recommendations.length,
        },
      },
      supabase,
    );

    return jsonOk({ recommendation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not recommend machines.";
    return jsonError(message, 500);
  }
}
