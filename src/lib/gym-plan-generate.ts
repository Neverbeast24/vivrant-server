import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit";
import { ownedTableWriter } from "@/lib/supabase/admin";
import { buildUserContext } from "@/lib/ai/context";
import { generateGymPlan, type GymPlanPayload } from "@/lib/ai/gemini";
import {
  applyRoutineOverrides,
  clampGymPlanPrefs,
  GYM_PLAN_LEVELS,
  type GymPlanLevel,
  type GymPlanPrefs,
  type RoutineScaling,
} from "@/lib/health/body-metrics";
import {
  buildGymPlanAvailableExercises,
  constrainGymPlanToKnownMoves,
  enrichGymPlanDays,
  GYM_PLAN_CATALOG_FALLBACK,
  hydrateGymPlan,
  clampGymPlanRecommendations,
  parseGymPlanDays,
  parseTrainingDays,
  resolveTrainingDays,
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

async function loadSavedProgramsForGeneration(
  supabase: SupabaseClient,
  userId: string,
): Promise<Array<{ title: string; days: GymPlanDay[] }>> {
  const { data } = await supabase
    .from("gym_plans")
    .select("title, days")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(4);
  return (data ?? []).map((row) => ({
    title: String(row.title ?? "Saved program"),
    days: parseGymPlanDays(row.days).days,
  }));
}

export async function generatePreparedGymPlan(
  supabase: SupabaseClient,
  userId: string,
  prefs: GymPlanPrefs,
  options?: {
    generateDays?: number[];
    keptDays?: GymPlanDay[];
    savedPrograms?: Array<{ title: string; days: GymPlanDay[] }>;
  },
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
    saved_programs: options?.savedPrograms,
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
  draftOverride?: GymProgramDraft | null,
): Promise<GymProgramDraft> {
  const prefs = clampGymPlanPrefs(input);
  const existing = draftOverride ?? (await loadGymProgramDraft(supabase, userId));
  const allowed = new Set(prefs.training_days);
  const kept = Object.fromEntries(
    Object.entries(existing?.kept_days ?? {}).filter(([key]) => allowed.has(Number(key))),
  );
  const remaining = remainingTrainingDays(prefs.training_days, kept);
  const generateDays = remaining.length ? remaining : prefs.training_days;
  const baseDraft: GymProgramDraft = {
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
  };
  const keptList = assembleKeptPlanDays(baseDraft);
  if (draftOverride) {
    await saveGymProgramDraftRow(supabase, userId, { ...baseDraft, updated_at: new Date().toISOString() });
  }
  const savedPrograms = await loadSavedProgramsForGeneration(supabase, userId);

  const plan = await generatePreparedGymPlan(supabase, userId, prefs, {
    generateDays,
    keptDays: keptList,
    savedPrograms,
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

  const { data, error } = await ownedTableWriter(supabase)
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

export type SavedGymPlanUpdate = {
  title: string;
  summary?: string | null;
  focus?: string;
  level?: string;
  days: unknown;
  recommendations?: string[];
  training_days?: number[];
};

/** Update a committed gym program without regenerating it. */
export async function updateSavedGymPlan(
  supabase: SupabaseClient,
  userId: string,
  id: number,
  input: SavedGymPlanUpdate,
) {
  const title = String(input.title ?? "").trim().slice(0, 120);
  if (title.length < 1) return { ok: false as const, message: "Give the program a name." };

  const parsed = parseGymPlanDays(input.days);
  if (!parsed.days.length) {
    return { ok: false as const, message: "Keep at least one training day." };
  }
  const recs = clampGymPlanRecommendations(
    input.recommendations != null ? input.recommendations : parsed.recommendations,
  );
  const explicit = parseTrainingDays(
    input.training_days?.length ? input.training_days : parsed.training_days,
  );
  const trainingDays = explicit.length
    ? explicit
    : resolveTrainingDays({
        training_days: parsed.training_days,
        days: parsed.days,
        days_per_week: parsed.days.length,
      });
  const summaryRaw = String(input.summary ?? "").trim();
  const summary = summaryRaw ? summaryRaw.slice(0, 800) : null;
  const focus = String(input.focus ?? "full_body").trim().slice(0, 60) || "full_body";
  const level: GymPlanLevel = GYM_PLAN_LEVELS.includes(input.level as GymPlanLevel)
    ? (input.level as GymPlanLevel)
    : "beginner";

  const { data, error } = await ownedTableWriter(supabase)
    .from("gym_plans")
    .update({
      title,
      summary,
      focus,
      level,
      days_per_week: trainingDays.length || parsed.days.length,
      days: serializeGymPlanDays(parsed.days, recs, trainingDays),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title, focus, level, days_per_week, summary, days, created_at")
    .single();
  if (error) return { ok: false as const, message: error.message };
  if (!data) return { ok: false as const, message: "Program not found." };

  await writeAuditLog(
    {
      action: "gym_plan_updated",
      entity: "gym_plans",
      entityId: String(id),
      metadata: { title, days: parsed.days.length },
    },
    supabase,
  );

  return {
    ok: true as const,
    message: "Program updated.",
    plan: hydrateGymPlan(data),
  };
}

export async function discardGymProgramDraft(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("gym_program_drafts").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

const LIVE_SESSION_COLUMNS =
  "plan_id, day_label, session_date, checks, names, weights, extras, removed_keys, meta, started_at, rest_ends_at, rest_label, rest_total, rest_alerted, rest_kind, updated_at";
const LIVE_SESSION_COLUMNS_EXTRAS =
  "plan_id, day_label, session_date, checks, names, weights, extras, removed_keys, started_at, rest_ends_at, rest_label, rest_total, rest_alerted, rest_kind, updated_at";
const LIVE_SESSION_COLUMNS_WEIGHTS =
  "plan_id, day_label, session_date, checks, names, weights, started_at, rest_ends_at, rest_label, rest_total, rest_alerted, updated_at";
const LIVE_SESSION_COLUMNS_LEGACY =
  "plan_id, day_label, session_date, checks, names, started_at, rest_ends_at, rest_label, rest_total, rest_alerted, updated_at";

export async function loadGymLiveSessionRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<GymLiveSessionDraft | null> {
  let { data, error } = await supabase
    .from("gym_live_sessions")
    .select(LIVE_SESSION_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error && /meta/i.test(error.message)) {
    ({ data, error } = await supabase
      .from("gym_live_sessions")
      .select(LIVE_SESSION_COLUMNS_EXTRAS)
      .eq("user_id", userId)
      .maybeSingle());
  }
  if (error && /(extras|removed_keys|rest_kind)/i.test(error.message)) {
    ({ data, error } = await supabase
      .from("gym_live_sessions")
      .select(LIVE_SESSION_COLUMNS_WEIGHTS)
      .eq("user_id", userId)
      .maybeSingle());
  }
  if (error && /weights/i.test(error.message)) {
    ({ data, error } = await supabase
      .from("gym_live_sessions")
      .select(LIVE_SESSION_COLUMNS_LEGACY)
      .eq("user_id", userId)
      .maybeSingle());
  }
  if (error || !data) return null;
  return parseGymLiveSession(data);
}

export async function saveGymLiveSessionRow(
  supabase: SupabaseClient,
  userId: string,
  draft: GymLiveSessionDraft,
) {
  const payload = {
    user_id: userId,
    ...serializeLiveSessionForDb(draft),
  };
  let { error } = await supabase.from("gym_live_sessions").upsert(payload, { onConflict: "user_id" });
  if (error && /meta/i.test(error.message)) {
    const { meta: _meta, ...withoutMeta } = payload;
    ({ error } = await supabase.from("gym_live_sessions").upsert(withoutMeta, { onConflict: "user_id" }));
  }
  if (error && /(extras|removed_keys|rest_kind)/i.test(error.message)) {
    const { extras: _extras, removed_keys: _removed, rest_kind: _kind, meta: _meta, ...withoutUi } = payload;
    ({ error } = await supabase.from("gym_live_sessions").upsert(withoutUi, { onConflict: "user_id" }));
  }
  if (error && /weights/i.test(error.message)) {
    const { weights: _weights, extras: _extras, removed_keys: _removed, rest_kind: _kind, meta: _meta, ...legacy } = payload;
    ({ error } = await supabase.from("gym_live_sessions").upsert(legacy, { onConflict: "user_id" }));
  }
  if (error) throw new Error(error.message);
}

export async function clearGymLiveSessionRow(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("gym_live_sessions").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}
