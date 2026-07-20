import { GoogleGenerativeAI } from "@google/generative-ai";

export type InsightPayload = {
  title: string;
  body: string;
  score: number;
};

export type MealEstimate = {
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tip: string;
};

export type GroceryPlanItem = {
  name: string;
  category: string;
  quantity: string;
};

export type GroceryPlan = {
  title: string;
  summary: string;
  meals: string[];
  items: GroceryPlanItem[];
};

export type WorkoutSuggestion = {
  title: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
  reason: string;
};

export type SpendingAdvice = {
  title: string;
  body: string;
  swap: string;
  score: number;
};

export type WeeklyStory = {
  title: string;
  story: string;
  focuses: string[];
  score: number;
};

export type GoalSuggestion = {
  title: string;
  category: string;
  target_value: number | null;
  unit: string | null;
  why: string;
};

export type ChatAnswer = {
  answer: string;
  follow_up: string;
};

export type MemberSummary = {
  title: string;
  summary: string;
  risks: string[];
  wins: string[];
};

/** Compact wellness primer — better than dumping huge public datasets. */
export const WELLNESS_GUIDE = `
VIVA wellness principles (use as soft guidance, not medical advice):
- Energy and mood improve with consistent sleep (7–9h), protein-forward meals, and daily movement.
- Hydration target ~2–2.5L/day for most adults unless otherwise advised by a clinician.
- Prefer whole foods, fiber, and steady protein across the day over large sugar spikes.
- Strength + walking beats all-or-nothing intense workouts for sustainable habits.
- Health spending is an investment when it supports food quality, movement, sleep, or recovery.
- Never diagnose disease. Suggest gentle next actions the user can do today.
- Currency for spending advice is Philippine pesos (₱) unless the logs say otherwise.
`.trim();

export function getGeminiModel(json = true) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to your server environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
    generationConfig: {
      temperature: 0.7,
      ...(json ? { responseMimeType: "application/json" as const } : {}),
    },
  });
}

async function generateJson<T>(prompt: string): Promise<T> {
  const model = getGeminiModel(true);
  const result = await model.generateContent(`${WELLNESS_GUIDE}\n\n${prompt}`);
  const text = result.response.text();
  return JSON.parse(text) as T;
}

export async function generateHealthInsight(context: string): Promise<InsightPayload> {
  const parsed = await generateJson<Partial<InsightPayload>>(`You are VIVA, a calm personal vitality coach.
Using ONLY the user's recent logs below, return ONE actionable insight as JSON with keys:
- "title": short headline (max 8 words)
- "body": 2–3 sentences with a concrete next action for today/tomorrow
- "score": integer 0–100 reflecting how confident/useful this recommendation is for this user right now

If data is sparse, still give a helpful starter habit suggestion and lower the score.
Do not invent medical diagnoses. Do not mention that you are an AI model.

USER LOGS:
${context}`);

  return {
    title: String(parsed.title ?? "Keep your rhythm gentle").slice(0, 120),
    body: String(
      parsed.body ??
        "Log a check-in and one meal today so VIVA can personalize your next move.",
    ).slice(0, 1200),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 70)))),
  };
}

export async function askViva(context: string, question: string): Promise<ChatAnswer> {
  const parsed = await generateJson<Partial<ChatAnswer>>(`You are VIVA. Answer the user's question using ONLY their logs and profile.
Return JSON:
- "answer": 2–5 calm sentences, practical, no diagnosis
- "follow_up": one short suggested next question they could ask

USER QUESTION:
${question}

USER LOGS:
${context}`);

  return {
    answer: String(parsed.answer ?? "Log a bit more today and ask again — I'll personalize from your rhythm.").slice(0, 2000),
    follow_up: String(parsed.follow_up ?? "What should I focus on tomorrow?").slice(0, 200),
  };
}

export async function estimateMealMacros(description: string, context: string): Promise<MealEstimate> {
  const parsed = await generateJson<Partial<MealEstimate>>(`Estimate nutrition for this meal description.
Return JSON:
- "meal_name": cleaned short name
- "calories": integer kcal estimate
- "protein_g": number
- "carbs_g": number
- "fat_g": number
- "tip": one short coaching tip tied to the user's goals if possible

MEAL DESCRIPTION:
${description}

USER CONTEXT:
${context}`);

  return {
    meal_name: String(parsed.meal_name ?? description).slice(0, 120),
    calories: Math.max(0, Math.round(Number(parsed.calories ?? 0))),
    protein_g: Math.max(0, Number(parsed.protein_g ?? 0)),
    carbs_g: Math.max(0, Number(parsed.carbs_g ?? 0)),
    fat_g: Math.max(0, Number(parsed.fat_g ?? 0)),
    tip: String(parsed.tip ?? "Add a protein side if you're still hungry.").slice(0, 300),
  };
}

export async function planGroceriesFromPantry(context: string): Promise<GroceryPlan> {
  const parsed = await generateJson<Partial<GroceryPlan>>(`Create a practical grocery + meal plan from pantry stock and open list.
Return JSON:
- "title": short plan name
- "summary": 2 sentences
- "meals": array of 3 dinner/lunch ideas using what they have when possible
- "items": array of { "name", "category", "quantity" }
  category must be one of: produce, protein, dairy, grains, pantry, snacks, drinks, household, other
  Prefer 6–12 shopping items. Avoid duplicates already clearly on the open grocery list.

USER CONTEXT:
${context}`);

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return {
    title: String(parsed.title ?? "This week's smart list").slice(0, 120),
    summary: String(parsed.summary ?? "A few focused items to support your meals.").slice(0, 600),
    meals: (Array.isArray(parsed.meals) ? parsed.meals : []).map((m) => String(m).slice(0, 120)).slice(0, 5),
    items: items.slice(0, 12).map((item) => ({
      name: String(item?.name ?? "Item").slice(0, 80),
      category: String(item?.category ?? "other"),
      quantity: String(item?.quantity ?? "1").slice(0, 40),
    })),
  };
}

export async function suggestWorkout(context: string): Promise<WorkoutSuggestion> {
  const parsed = await generateJson<Partial<WorkoutSuggestion>>(`Suggest ONE workout for today based on energy, mood, steps, and goals.
Return JSON:
- "title"
- "activity_type": one of walk, run, strength, cycle, yoga, other
- "duration_minutes": integer
- "calories_burned": integer estimate
- "reason": 1–2 sentences

USER CONTEXT:
${context}`);

  const allowed = new Set(["walk", "run", "strength", "cycle", "yoga", "other"]);
  const activity = String(parsed.activity_type ?? "walk");
  return {
    title: String(parsed.title ?? "Easy recovery walk").slice(0, 120),
    activity_type: allowed.has(activity) ? activity : "walk",
    duration_minutes: Math.max(5, Math.min(90, Math.round(Number(parsed.duration_minutes ?? 20)))),
    calories_burned: Math.max(0, Math.round(Number(parsed.calories_burned ?? 80))),
    reason: String(parsed.reason ?? "A gentle session fits your current rhythm.").slice(0, 400),
  };
}

export async function coachSpending(context: string): Promise<SpendingAdvice> {
  const parsed = await generateJson<Partial<SpendingAdvice>>(`Give one health-budget coaching tip from recent expenses and monthly budget.
Return JSON:
- "title"
- "body": 2–3 sentences
- "swap": one concrete spending swap this week
- "score": 0–100

USER CONTEXT:
${context}`);

  return {
    title: String(parsed.title ?? "Spend toward vitality").slice(0, 120),
    body: String(parsed.body ?? "Review this week's food vs wellness spend and protect your grocery quality.").slice(0, 800),
    swap: String(parsed.swap ?? "Move one snack spend into whole foods.").slice(0, 200),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 70)))),
  };
}

export async function writeWeeklyStory(context: string): Promise<WeeklyStory> {
  const parsed = await generateJson<Partial<WeeklyStory>>(`Write a short weekly wellbeing story from the user's logs.
Return JSON:
- "title"
- "story": 3–5 sentences, warm and specific
- "focuses": array of exactly 3 short focus areas for next week
- "score": 0–100 vitality rhythm score

USER CONTEXT:
${context}`);

  const focuses = Array.isArray(parsed.focuses) ? parsed.focuses : ["Hydration", "Movement", "Sleep"];
  return {
    title: String(parsed.title ?? "Your week in rhythm").slice(0, 120),
    story: String(parsed.story ?? "You're building a gentler routine. Keep logging so the story gets clearer.").slice(0, 1500),
    focuses: focuses.map((f) => String(f).slice(0, 40)).slice(0, 3),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 70)))),
  };
}

export async function suggestGoals(context: string): Promise<GoalSuggestion[]> {
  const parsed = await generateJson<{ goals?: Partial<GoalSuggestion>[] }>(`Suggest up to 3 measurable health goals for this user.
Return JSON: { "goals": [ { "title", "category", "target_value", "unit", "why" } ] }
category one of: nutrition, movement, sleep, mindfulness, spending, other

USER CONTEXT:
${context}`);

  const goals = Array.isArray(parsed.goals) ? parsed.goals : [];
  return goals.slice(0, 3).map((goal) => ({
    title: String(goal.title ?? "Stay consistent").slice(0, 120),
    category: String(goal.category ?? "other"),
    target_value: goal.target_value == null ? null : Number(goal.target_value),
    unit: goal.unit == null ? null : String(goal.unit).slice(0, 40),
    why: String(goal.why ?? "Supports your current focus.").slice(0, 300),
  }));
}

export async function summarizeMemberWeek(context: string): Promise<MemberSummary> {
  const parsed = await generateJson<Partial<MemberSummary>>(`Summarize this member's last week for a Super Admin support view.
Return JSON:
- "title"
- "summary": 3–5 sentences
- "risks": up to 3 short risk notes (gentle, non-diagnostic)
- "wins": up to 3 short wins

MEMBER CONTEXT:
${context}`);

  return {
    title: String(parsed.title ?? "Member week overview").slice(0, 120),
    summary: String(parsed.summary ?? "Limited recent activity logged.").slice(0, 1500),
    risks: (Array.isArray(parsed.risks) ? parsed.risks : []).map((r) => String(r).slice(0, 120)).slice(0, 3),
    wins: (Array.isArray(parsed.wins) ? parsed.wins : []).map((w) => String(w).slice(0, 120)).slice(0, 3),
  };
}

export type GymPlanDay = {
  day: string;
  focus: string;
  exercises: { name: string; sets: string; rest: string; notes?: string }[];
};

export type GymPlanPayload = {
  title: string;
  focus: string;
  level: string;
  days_per_week: number;
  summary: string;
  days: GymPlanDay[];
};

export type HealthHistoryInsight = {
  title: string;
  body: string;
  trend: string;
  next_step: string;
  score: number;
};

export async function generateGymPlan(
  context: string,
  availableExercises: string,
): Promise<GymPlanPayload> {
  const parsed = await generateJson<Partial<GymPlanPayload>>(`Create a practical gym / home training plan for this user.
Use their profile, energy, goals, and recent activity. Prefer exercises from the available catalog when possible.
Return JSON:
- "title"
- "focus": one of full_body, strength, fat_loss, mobility, endurance
- "level": beginner | intermediate | advanced
- "days_per_week": 2-5
- "summary": 2 sentences
- "days": array of { "day", "focus", "exercises": [{ "name", "sets", "rest", "notes" }] }
  Include 3–5 exercises per day.

AVAILABLE EXERCISES:
${availableExercises}

USER CONTEXT:
${context}`);

  const days = Array.isArray(parsed.days) ? parsed.days : [];
  return {
    title: String(parsed.title ?? "Your VIVA gym plan").slice(0, 120),
    focus: String(parsed.focus ?? "full_body"),
    level: String(parsed.level ?? "beginner"),
    days_per_week: Math.max(2, Math.min(5, Math.round(Number(parsed.days_per_week ?? 3)))),
    summary: String(parsed.summary ?? "A gentle plan matched to your current rhythm.").slice(0, 600),
    days: days.slice(0, 5).map((day) => ({
      day: String(day?.day ?? "Day").slice(0, 40),
      focus: String(day?.focus ?? "Training").slice(0, 60),
      exercises: (Array.isArray(day?.exercises) ? day.exercises : []).slice(0, 6).map((ex) => ({
        name: String(ex?.name ?? "Movement").slice(0, 80),
        sets: String(ex?.sets ?? "3 x 10").slice(0, 40),
        rest: String(ex?.rest ?? "60s").slice(0, 20),
        notes: ex?.notes ? String(ex.notes).slice(0, 120) : undefined,
      })),
    })),
  };
}

export async function analyzeHealthHistory(context: string): Promise<HealthHistoryInsight> {
  const parsed = await generateJson<Partial<HealthHistoryInsight>>(`Analyze this user's health history (weight/height trend) and profile.
Return JSON:
- "title"
- "body": 2–3 calm sentences (no diagnosis)
- "trend": short phrase like "Steady downward" or "Needs more data"
- "next_step": one concrete action for this week
- "score": 0–100 confidence

USER CONTEXT:
${context}`);

  return {
    title: String(parsed.title ?? "Your body story").slice(0, 120),
    body: String(parsed.body ?? "Keep logging weight weekly so VIVA can spot clearer patterns.").slice(0, 800),
    trend: String(parsed.trend ?? "Building history").slice(0, 80),
    next_step: String(parsed.next_step ?? "Log one weigh-in this week at the same time of day.").slice(0, 200),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 60)))),
  };
}

export async function draftReminder(context: string): Promise<InsightPayload> {
  const parsed = await generateJson<Partial<InsightPayload>>(`Draft ONE short push-notification style reminder for this user today.
Return JSON:
- "title": max 6 words
- "body": one sentence, friendly, actionable
- "score": 0–100 urgency/usefulness

USER CONTEXT:
${context}`);

  return {
    title: String(parsed.title ?? "A gentle nudge").slice(0, 60),
    body: String(parsed.body ?? "Take one small step toward your vitality goal today.").slice(0, 180),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 70)))),
  };
}
