import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { generateGymPlan, type GymPlanPayload } from "@/lib/ai/gemini";
import {
  applyRoutineOverrides,
  clampGymPlanPrefs,
  type GymPlanPrefs,
  type RoutineScaling,
} from "@/lib/health/body-metrics";
import {
  buildGymPlanAvailableExercises,
  constrainGymPlanToKnownMoves,
  enrichGymPlanDays,
  GYM_PLAN_CATALOG_FALLBACK,
  hydrateGymPlan,
  serializeGymPlanDays,
  type GymPlanDay,
} from "@/lib/gym";
import {
  assembleKeptPlanDays,
  keptIsoList,
  mapPreviewToWeekdays,
  parseGymProgramDraft,
  remainingTrainingDays,
  type GymProgramDraft,
} from "@/lib/gym-program-draft";
import {
  parseGymLiveSession,
  serializeLiveSessionForDb,
  type GymLiveSessionDraft,
} from "@/lib/gym-live-session";

function withPlanPrefs(context: string, prefs: GymPlanPrefs) {
  try {
    const parsed = JSON.parse(context) as { routine_scaling?: RoutineScaling };
    if (parsed.routine_scaling) {
      parsed.routine_scaling = applyRoutineOverrides(parsed.routine_scaling, prefs);
    }
    return JSON.stringify({
      ...parsed,
      plan_prefs: prefs,
    });
  } catch {
    return context;
  }
}

export async function generatePreparedGymPlan(
  supabase: SupabaseClient,
  userId: string,
  prefs: GymPlanPrefs,
  options?: { generateDays?: number[]; keptDays?: GymPlanDay[] },
): Promise<GymPlanPayload> {
  const [{ data: exercises }, rawContext] = await Promise.all([
    supabase
      .from("gym_exercises")
      .select("slug, name, muscle_group, equipment, difficulty")
      .order("name"),
    buildUserContext(userId, { supabase }),
  ]);

  const context = withPlanPrefs(rawContext, prefs);
  const avoidSet = new Set(prefs.avoid_targets);
  const rows = (exercises ?? []).filter((row) => {
    if (!avoidSet.size) return true;
    return !avoidSet.has(String(row.muscle_group).toLowerCase());
  });
  const catalogItems = (exercises ?? []).map((row) => ({
    slug: String(row.slug),
    name: String(row.name),
    muscle_group: String(row.muscle_group),
    equipment: String(row.equipment),
  }));
  const { catalogText, knownRows, restrictToKnown } = buildGymPlanAvailableExercises(
    rows.map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      muscle_group: String(row.muscle_group),
      equipment: String(row.equipment),
      difficulty: String(row.difficulty),
    })),
    prefs,
  );

  const generateDays = options?.generateDays?.length ? options.generateDays : prefs.training_days;
  const plan = await generateGymPlan(context, catalogText || GYM_PLAN_CATALOG_FALLBACK, {
    ...prefs,
    generate_days: generateDays,
    kept_days: options?.keptDays,
  });

  const days = mapPreviewToWeekdays(
    enrichGymPlanDays(
      constrainGymPlanToKnownMoves(
        plan.days,
        knownRows,
        prefs.known_custom_exercises,
        catalogItems,
      ),
      restrictToKnown ? knownRows : catalogItems,
      prefs.avoid_targets,
    ),
    generateDays,
  );

  return { ...plan, days, days_per_week: generateDays.length };
}

export async function loadGymProgramDraft(
  supabase: SupabaseClient,
  userId: string,
): Promise<GymProgramDraft | null> {
  const { data, error } = await supabase
    .from("gym_program_drafts")
    .select(
      "title, focus, level, summary, recommendations, prefs, preview_days, kept_days, training_days, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return parseGymProgramDraft(data);
}

export async function saveGymProgramDraftRow(
  supabase: SupabaseClient,
  userId: string,
  draft: GymProgramDraft,
) {
  const payload = {
    user_id: userId,
    title: draft.title,
    focus: draft.focus,
    level: draft.level,
    summary: draft.summary,
    recommendations: draft.recommendations,
    prefs: draft.prefs,
    preview_days: draft.preview_days,
    kept_days: draft.kept_days,
    training_days: draft.training_days,
    updated_at: draft.updated_at,
  };
  const { error } = await supabase.from("gym_program_drafts").upsert(payload, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  return draft;
}

export async function previewGymProgram(
  supabase: SupabaseClient,
  userId: string,
  input?: Partial<GymPlanPrefs>,
): Promise<GymProgramDraft> {
  const prefs = clampGymPlanPrefs(input);
  const existing = await loadGymProgramDraft(supabase, userId);
  const allowed = new Set(prefs.training_days);
  const kept = Object.fromEntries(
    Object.entries(existing?.kept_days ?? {}).filter(([key]) => allowed.has(Number(key))),
  );
  const remaining = remainingTrainingDays(prefs.training_days, kept);
  const generateDays = remaining.length ? remaining : prefs.training_days;
  const keptList = assembleKeptPlanDays({
    title: existing?.title ?? "",
    focus: existing?.focus ?? prefs.level,
    level: existing?.level ?? prefs.level,
    summary: existing?.summary ?? null,
    recommendations: existing?.recommendations ?? [],
    prefs,
    preview_days: existing?.preview_days ?? [],
    kept_days: kept,
    training_days: prefs.training_days,
    updated_at: existing?.updated_at ?? new Date().toISOString(),
  });

  const plan = await generatePreparedGymPlan(supabase, userId, prefs, {
    generateDays,
    keptDays: keptList,
  });

  const draft: GymProgramDraft = {
    title: plan.title,
    focus: plan.focus,
    level: plan.level,
    summary: plan.summary,
    recommendations: plan.recommendations,
    prefs,
    preview_days: plan.days,
    kept_days: kept,
    training_days: prefs.training_days,
    updated_at: new Date().toISOString(),
  };
  await saveGymProgramDraftRow(supabase, userId, draft);
  return draft;
}

export async function commitGymProgramDraft(
  supabase: SupabaseClient,
  userId: string,
  draftOverride?: GymProgramDraft | null,
) {
  const draft = draftOverride ?? (await loadGymProgramDraft(supabase, userId));
  if (!draft) return { ok: false as const, message: "Generate workouts first, then keep the days you want." };
  const days = assembleKeptPlanDays(draft);
  if (!days.length) {
    return { ok: false as const, message: "Keep at least one day before saving the program." };
  }
  const trainingDays = keptIsoList(draft.kept_days);

  const { data, error } = await supabase
    .from("gym_plans")
    .insert({
      user_id: userId,
      title: draft.title,
      focus: draft.focus,
      level: draft.level,
      days_per_week: trainingDays.length,
      summary: draft.summary,
      days: serializeGymPlanDays(days, draft.recommendations, trainingDays),
    })
    .select("id, title, focus, level, days_per_week, summary, days, created_at")
    .single();
  if (error) return { ok: false as const, message: error.message };

  await supabase.from("gym_program_drafts").delete().eq("user_id", userId);
  await writeAuditLog(
    {
      action: "gym_plan_created",
      entity: "gym_plans",
      entityId: data?.id != null ? String(data.id) : undefined,
      metadata: {
        title: draft.title,
        focus: draft.focus,
        level: draft.level,
        source: "program_builder",
        kept_days: trainingDays,
      },
    },
    supabase,
  );

  return {
    ok: true as const,
    message: "Training program saved from the days you kept.",
    plan: data ? hydrateGymPlan(data) : data,
  };
}

export async function discardGymProgramDraft(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("gym_program_drafts").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function loadGymLiveSessionRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<GymLiveSessionDraft | null> {
  const { data, error } = await supabase
    .from("gym_live_sessions")
    .select(
      "plan_id, day_label, session_date, checks, names, started_at, rest_ends_at, rest_label, rest_total, rest_alerted, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return parseGymLiveSession(data);
}

export async function saveGymLiveSessionRow(
  supabase: SupabaseClient,
  userId: string,
  draft: GymLiveSessionDraft,
) {
  const { error } = await supabase.from("gym_live_sessions").upsert(
    {
      user_id: userId,
      ...serializeLiveSessionForDb(draft),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}

export async function clearGymLiveSessionRow(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("gym_live_sessions").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}
