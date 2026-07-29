import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyUsers } from "@/lib/notifications/notify";

function weekBounds() {
  const ends = new Date();
  const starts = new Date();
  starts.setDate(ends.getDate() - 6);
  return {
    start: starts.toISOString().slice(0, 10),
    end: ends.toISOString().slice(0, 10),
  };
}

async function metricValue(
  supabase: SupabaseClient,
  userId: string,
  metric: string,
  start: string,
  end: string,
) {
  switch (metric) {
    case "habits": {
      const { count } = await supabase
        .from("habit_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("logged_on", start)
        .lte("logged_on", end);
      return count ?? 0;
    }
    case "workouts": {
      const { count } = await supabase
        .from("workout_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("logged_at", `${start}T00:00:00`)
        .lte("logged_at", `${end}T23:59:59`);
      return count ?? 0;
    }
    case "gym": {
      const { count } = await supabase
        .from("gym_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("logged_at", `${start}T00:00:00`)
        .lte("logged_at", `${end}T23:59:59`);
      return count ?? 0;
    }
    case "checkins": {
      const { count } = await supabase
        .from("daily_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("checkin_date", start)
        .lte("checkin_date", end);
      return count ?? 0;
    }
    case "water": {
      const { data } = await supabase
        .from("daily_checkins")
        .select("water_ml")
        .eq("user_id", userId)
        .gte("checkin_date", start)
        .lte("checkin_date", end);
      return (data ?? []).reduce((s, r) => s + Number(r.water_ml ?? 0), 0);
    }
    case "sleep": {
      const { data } = await supabase
        .from("daily_checkins")
        .select("sleep_minutes")
        .eq("user_id", userId)
        .gte("checkin_date", start)
        .lte("checkin_date", end);
      const withSleep = (data ?? []).filter((r) => r.sleep_minutes != null);
      if (!withSleep.length) return 0;
      return (
        withSleep.reduce((s, r) => s + Number(r.sleep_minutes ?? 0), 0) /
        withSleep.length /
        60
      );
    }
    default:
      return 0;
  }
}

/** Refresh challenge_progress for a user's active challenges. */
export async function syncChallengeProgress(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: challenges } = await supabase
    .from("challenges")
    .select("id, title, metric, target_value, starts_on, ends_on")
    .eq("user_id", userId)
    .gte("ends_on", new Date().toISOString().slice(0, 10));

  if (!challenges?.length) return { updated: 0 };

  const { data: existingRows } = await supabase
    .from("challenge_progress")
    .select("id, challenge_id, current_value, completed")
    .eq("user_id", userId)
    .in(
      "challenge_id",
      challenges.map((c) => c.id),
    );

  const existingByChallenge = new Map(
    (existingRows ?? []).map((row) => [row.challenge_id, row] as const),
  );

  const values = await Promise.all(
    challenges.map((challenge) =>
      metricValue(
        supabase,
        userId,
        challenge.metric,
        challenge.starts_on,
        challenge.ends_on,
      ).then((value) => ({ challenge, value })),
    ),
  );

  const inserts: Array<{
    challenge_id: number;
    user_id: string;
    current_value: number;
    completed: boolean;
  }> = [];
  const updates: Array<{
    id: number;
    current_value: number;
    completed: boolean;
  }> = [];
  const newlyCompleted: Array<{ title: string }> = [];

  for (const { challenge, value } of values) {
    const completed = value >= Number(challenge.target_value);
    const existing = existingByChallenge.get(challenge.id);
    if (!existing) {
      inserts.push({
        challenge_id: challenge.id,
        user_id: userId,
        current_value: value,
        completed,
      });
      continue;
    }
    if (
      Number(existing.current_value) === value &&
      Boolean(existing.completed) === completed
    ) {
      continue;
    }
    updates.push({ id: existing.id, current_value: value, completed });
    if (completed && !existing.completed) {
      newlyCompleted.push({ title: challenge.title });
    }
  }

  await Promise.all([
    inserts.length
      ? supabase.from("challenge_progress").insert(inserts)
      : Promise.resolve(),
    ...updates.map((row) =>
      supabase
        .from("challenge_progress")
        .update({ current_value: row.current_value, completed: row.completed })
        .eq("id", row.id),
    ),
  ]);

  if (newlyCompleted.length) {
    await Promise.all(
      newlyCompleted.map((item) =>
        notifyUsers({
          userIds: [userId],
          title: "Challenge complete",
          body: `You hit your target for “${item.title}”.`,
          href: "/dashboard/habits/challenges",
          asUserClient: supabase,
        }),
      ),
    );
  }

  return { updated: inserts.length + updates.length };
}

export function defaultWeekChallengeDates() {
  const { start, end } = weekBounds();
  return { starts_on: start, ends_on: end };
}
