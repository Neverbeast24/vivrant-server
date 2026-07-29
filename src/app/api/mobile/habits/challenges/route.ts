import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson, todayDate } from "@/lib/mobile/http";
import { defaultWeekChallengeDates, syncChallengeProgress } from "@/lib/challenges/progress";

export const runtime = "nodejs";

const METRICS = ["habits", "workouts", "water", "sleep", "checkins", "gym"] as const;
type Metric = (typeof METRICS)[number];

const UNIT_TO_METRIC: Record<string, Metric> = {
  habits: "habits",
  habit: "habits",
  workouts: "workouts",
  workout: "workouts",
  ml: "water",
  water: "water",
  hours: "sleep",
  hrs: "sleep",
  sleep: "sleep",
  checkins: "checkins",
  checkin: "checkins",
  gym: "gym",
  sessions: "gym",
};

function resolveMetric(metric: unknown, unit: unknown): Metric {
  if (typeof metric === "string" && METRICS.includes(metric as Metric)) {
    return metric as Metric;
  }
  if (typeof unit === "string") {
    const mapped = UNIT_TO_METRIC[unit.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  return "habits";
}

const challengeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  metric: z.string().optional(),
  unit: z.string().optional(),
  target_value: z.coerce.number().min(1).max(1_000_000),
  starts_on: z.string().date().optional(),
  ends_on: z.string().date().optional(),
});

export async function GET(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  // Progress is synced on writes + /refresh — don't block every list GET.
  void syncChallengeProgress(supabase, user.id).catch(() => null);

  const [{ data: challenges, error }, { data: progress }] = await Promise.all([
    supabase
      .from("challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("ends_on", { ascending: false })
      .limit(20),
    supabase
      .from("challenge_progress")
      .select("challenge_id, current_value, completed")
      .eq("user_id", user.id),
  ]);

  if (error) return jsonError(error.message, 500);

  const progressMap = new Map((progress ?? []).map((p) => [p.challenge_id, p] as const));
  const challengesWithProgress = (challenges ?? []).map((challenge) => {
    const p = progressMap.get(challenge.id);
    return {
      ...challenge,
      target_value: Number(challenge.target_value),
      current_value: Number(p?.current_value ?? 0),
      completed: Boolean(p?.completed),
    };
  });

  return jsonOk({ challenges: challengesWithProgress });
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const body = await readJson(request);
  if (body === null) return jsonError("Invalid JSON body.");

  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Fill in challenge details.");

  const defaults = defaultWeekChallengeDates();
  const metric = resolveMetric(parsed.data.metric, parsed.data.unit);
  const starts_on = parsed.data.starts_on ?? defaults.starts_on ?? todayDate();
  const ends_on = parsed.data.ends_on ?? defaults.ends_on;

  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      metric,
      target_value: parsed.data.target_value,
      starts_on,
      ends_on,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  await supabase.from("challenge_progress").insert({
    challenge_id: challenge.id,
    user_id: user.id,
    current_value: 0,
    completed: false,
  });

  void syncChallengeProgress(supabase, user.id).catch(() => null);

  return jsonOk({
    challenge: {
      ...challenge,
      target_value: Number(challenge.target_value),
      current_value: 0,
      completed: false,
    },
  });
}
