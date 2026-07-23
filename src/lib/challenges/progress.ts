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

  let updated = 0;
  for (const challenge of challenges) {
    const value = await metricValue(
      supabase,
      userId,
      challenge.metric,
      challenge.starts_on,
      challenge.ends_on,
    );
    const completed = value >= Number(challenge.target_value);
    const { data: existing } = await supabase
      .from("challenge_progress")
      .select("id, current_value, completed")
      .eq("challenge_id", challenge.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("challenge_progress").insert({
        challenge_id: challenge.id,
        user_id: userId,
        current_value: value,
        completed,
      });
      updated += 1;
    } else {
      const wasComplete = existing.completed;
      await supabase
        .from("challenge_progress")
        .update({ current_value: value, completed })
        .eq("id", existing.id);
      updated += 1;
      if (completed && !wasComplete) {
        await notifyUsers({
          userIds: [userId],
          title: "Challenge complete",
          body: `You hit your target for “${challenge.title}”.`,
          href: "/dashboard/habits/challenges",
          asUserClient: supabase,
        });
      }
    }
  }

  return { updated };
}

export function defaultWeekChallengeDates() {
  const { start, end } = weekBounds();
  return { starts_on: start, ends_on: end };
}
