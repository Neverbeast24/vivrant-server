import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  catalogHintForPrompt,
  estimateGroceryPrice,
  estimateGroceryPriceDetailed,
  suggestGroceryCategory,
} from "@/lib/groceries/ph-price-catalog";

export type InsightPayload = {
  title: string;
  body: string;
  score: number;
};

export type MealEstimate = {
  meal_name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tip: string;
};

export type MealImageInput = {
  mimeType: string;
  base64: string;
};

export type GroceryPlanItem = {
  name: string;
  category: string;
  quantity: string;
  estimated_price: number;
};

export type GroceryPlan = {
  title: string;
  summary: string;
  meals: string[];
  items: GroceryPlanItem[];
  estimated_total: number;
  budget_note: string;
};

export type GroceryCostEstimate = {
  name: string;
  category: string;
  quantity: string;
  estimated_price: number;
  low: number;
  high: number;
  store_tip: string;
  confidence: "high" | "medium" | "low";
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
VIVRΛNT wellness principles (use as soft guidance, not medical advice):
- Energy and mood improve with consistent sleep (7–9h), protein-forward meals, and daily movement.
- Hydration target ~2–2.5L/day for most adults unless otherwise advised by a clinician.
- Prefer whole foods, fiber, and steady protein across the day over large sugar spikes.
- Strength + walking beats all-or-nothing intense workouts for sustainable habits.
- Health spending is an investment when it supports food quality, movement, sleep, or recovery.
- Never diagnose disease. Suggest gentle next actions the user can do today.
- Currency for spending advice is Philippine pesos (₱) unless the logs say otherwise.
`.trim();

const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGeminiCapacityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("Service Unavailable") ||
    message.includes("high demand") ||
    message.includes("Resource exhausted")
  );
}

function getModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim();
  const chain = primary
    ? [primary, ...FALLBACK_MODELS.filter((model) => model !== primary)]
    : [...FALLBACK_MODELS];
  return [...new Set(chain)];
}

function createGeminiModel(modelName: string, json: boolean) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini is not configured. Add GEMINI_API_KEY to your server environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      ...(json ? { responseMimeType: "application/json" as const } : {}),
    },
  });
}

/** @deprecated Prefer generateContentWithFallback — kept for callers that need a model handle. */
export function getGeminiModel(json = true) {
  return createGeminiModel(process.env.GEMINI_MODEL?.trim() ?? FALLBACK_MODELS[0], json);
}

async function generateContentWithFallback(
  prompt: string,
  json: boolean,
  image?: MealImageInput,
): Promise<string> {
  const models = getModelChain();
  let lastError: unknown;
  const textPrompt = `${WELLNESS_GUIDE}\n\n${prompt}`;

  for (const modelName of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = createGeminiModel(modelName, json);
        const result = image
          ? await model.generateContent([
              { text: textPrompt },
              { inlineData: { data: image.base64, mimeType: image.mimeType } },
            ])
          : await model.generateContent(textPrompt);
        return result.response.text();
      } catch (error) {
        lastError = error;
        if (isGeminiCapacityError(error)) {
          if (attempt === 0) {
            await sleep(900);
            continue;
          }
          break;
        }
        throw error;
      }
    }
  }

  throw new Error(
    "Gemini is busy right now (high demand on Google's side). Wait 30–60 seconds and try again. If this keeps happening, set GEMINI_MODEL=gemini-1.5-flash in Vercel environment variables.",
    { cause: lastError },
  );
}

function extractJsonText(raw: string): string {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) text = fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  // Strip trailing commas before } or ] — a common Gemini slip.
  return text.replace(/,\s*([}\]])/g, "$1");
}

function parseJsonLoose<T>(raw: string): T {
  const cleaned = extractJsonText(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError) {
    // Escape bare newlines inside strings that break JSON.parse.
    const escapedNewlines = cleaned.replace(
      /"(?:[^"\\]|\\.)*"/g,
      (segment) => segment.replace(/\n/g, "\\n").replace(/\r/g, "\\r"),
    );
    try {
      return JSON.parse(escapedNewlines) as T;
    } catch {
      const detail =
        firstError instanceof Error ? firstError.message : "Unexpected JSON shape.";
      throw new Error(
        `Could not read AI nutrition response (${detail}). Try a shorter description or another photo.`,
      );
    }
  }
}

async function generateJson<T>(prompt: string, image?: MealImageInput): Promise<T> {
  const text = await generateContentWithFallback(prompt, true, image);
  return parseJsonLoose<T>(text);
}

export async function generateHealthInsight(context: string): Promise<InsightPayload> {
  const parsed = await generateJson<Partial<InsightPayload>>(`You are VIVRΛNT, a calm personal vitality coach.
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
        "Log a check-in and one meal today so VIVRΛNT can personalize your next move.",
    ).slice(0, 1200),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 70)))),
  };
}

export async function askViva(context: string, question: string): Promise<ChatAnswer> {
  const parsed = await generateJson<Partial<ChatAnswer>>(`You are VIVRΛNT. Answer the user's question using ONLY their logs and profile.
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

export async function estimateMealMacros(
  description: string,
  context: string,
  image?: MealImageInput,
  portion: "small" | "typical" | "large" = "typical",
): Promise<MealEstimate> {
  const portionHint =
    portion === "small"
      ? "User said this was a SMALL / light portion — estimate on the low side."
      : portion === "large"
        ? "User said this was a LARGE / generous portion — estimate on the high side."
        : "User said this was a TYPICAL plate / bowl size.";

  const parsed = await generateJson<Partial<MealEstimate>>(
    `Estimate nutrition for this meal${image ? " from the attached photo and any description" : ""}.
The user does NOT have a food scale — give best-guess approximations, not lab precision.
Return ONLY one valid JSON object (no markdown, no comments, no trailing commas).
Keys:
- "meal_name": short cleaned name (max 8 words)
- "meal_type": one of "breakfast" | "lunch" | "dinner" | "snack"
- "calories": integer kcal estimate
- "protein_g": number (grams)
- "carbs_g": number (grams)
- "fat_g": number (grams)
- "tip": one short coaching tip (plain text, escape quotes if needed). Mention that numbers are estimates.

${portionHint}
If the photo is unclear, estimate conservatively and say so in tip.
Do not invent medical advice.

MEAL DESCRIPTION:
${description || "(use the photo)"}

USER CONTEXT:
${context}`,
    image,
  );

  const mealTypeRaw = String(parsed.meal_type ?? "lunch").toLowerCase();
  const meal_type =
    mealTypeRaw === "breakfast" ||
    mealTypeRaw === "lunch" ||
    mealTypeRaw === "dinner" ||
    mealTypeRaw === "snack"
      ? mealTypeRaw
      : "lunch";

  return {
    meal_name: String(parsed.meal_name ?? (description || "Meal")).slice(0, 120),
    meal_type,
    calories: Math.max(0, Math.round(Number(parsed.calories ?? 0))),
    protein_g: Math.max(0, Math.round(Number(parsed.protein_g ?? 0) * 10) / 10),
    carbs_g: Math.max(0, Math.round(Number(parsed.carbs_g ?? 0) * 10) / 10),
    fat_g: Math.max(0, Math.round(Number(parsed.fat_g ?? 0) * 10) / 10),
    tip: String(parsed.tip ?? "Add a protein side if you're still hungry.").slice(0, 300),
  };
}

export async function estimateGroceryCostWithAi(input: {
  name: string;
  quantity?: string;
  category?: string;
  context?: string;
}): Promise<GroceryCostEstimate> {
  const fallback = estimateGroceryPriceDetailed(
    input.name,
    input.quantity,
    input.category,
  );
  const name = input.name.slice(0, 120);
  const quantity = (input.quantity ?? "1").slice(0, 40);
  const suggested = input.category && input.category !== "other"
    ? input.category
    : suggestGroceryCategory(name);

  try {
    const parsed = await generateJson<Partial<GroceryCostEstimate>>(
      `You are a Philippine grocery pricing assistant (wet market + SM/Robinsons/Puregold mid-market).
Estimate a REALISTIC peso cost for ONE shopping-list line item for ${new Date().toLocaleString("en-PH", { month: "long", year: "numeric", timeZone: "Asia/Manila" })}.

Item: ${name}
Quantity: ${quantity}
Hint category: ${suggested}

Rules:
- estimated_price = typical mid supermarket total for that quantity (integer PHP)
- low = wet-market / promo floor; high = premium chain ceiling
- category MUST be one of: produce, protein, dairy, grains, pantry, snacks, drinks, household, other
  (hotdog/longganisa/tocino/bacon = protein; oatside/milk = dairy; never put meat in produce)
- store_tip: 1 short sentence (where to buy cheaper, unit size tip)
- confidence: high if common PH SKU, medium if brand-ambiguous, low if vague

Return JSON only:
{ "name", "category", "quantity", "estimated_price", "low", "high", "store_tip", "confidence" }

${catalogHintForPrompt()}
${input.context ? `\nUSER CONTEXT:\n${input.context}` : ""}`,
    );

    const categoryRaw = String(parsed.category ?? suggested);
    const allowed = new Set([
      "produce",
      "protein",
      "dairy",
      "grains",
      "pantry",
      "snacks",
      "drinks",
      "household",
      "other",
    ]);
    const category = allowed.has(categoryRaw) ? categoryRaw : suggested;
    const aiMid = Number(parsed.estimated_price);
    const aiLow = Number(parsed.low);
    const aiHigh = Number(parsed.high);
    const catalogMid = estimateGroceryPrice(name, quantity, category);
    // Blend AI with catalog so wild hallucinations get pulled toward PH market.
    const estimated_price =
      Number.isFinite(aiMid) && aiMid > 0
        ? Math.round(aiMid * 0.65 + catalogMid * 0.35)
        : catalogMid;
    const low =
      Number.isFinite(aiLow) && aiLow > 0
        ? Math.min(estimated_price, Math.round(aiLow))
        : Math.round(estimated_price * 0.88);
    const high =
      Number.isFinite(aiHigh) && aiHigh > 0
        ? Math.max(estimated_price, Math.round(aiHigh))
        : Math.round(estimated_price * 1.18);
    const confRaw = String(parsed.confidence ?? "medium").toLowerCase();
    const confidence =
      confRaw === "high" || confRaw === "low" ? confRaw : "medium";

    return {
      name: String(parsed.name ?? name).slice(0, 120),
      category,
      quantity: String(parsed.quantity ?? quantity).slice(0, 40),
      estimated_price: Math.max(5, estimated_price),
      low: Math.max(5, low),
      high: Math.max(low + 5, high),
      store_tip: String(
        parsed.store_tip ?? fallback.market_note,
      ).slice(0, 200),
      confidence,
    };
  } catch {
    return {
      name,
      category: fallback.category,
      quantity,
      estimated_price: fallback.estimated_price,
      low: fallback.low,
      high: fallback.high,
      store_tip: fallback.market_note,
      confidence: "medium",
    };
  }
}

export async function planGroceriesFromPantry(context: string): Promise<GroceryPlan> {
  const parsed = await generateJson<
    Partial<GroceryPlan> & { items?: Partial<GroceryPlanItem>[] }
  >(`Create a practical grocery + meal plan from pantry stock and open list.
Stay inside the user's remaining monthly health budget (see health_profile.monthly_health_budget, recent_expenses, and budget_for_groceries when present).
Every item MUST include a realistic Philippine peso estimated_price for the stated quantity.
Use grocery_price_market / ph_calendar for the CURRENT Asia/Manila year and month — prices shift with seasonality and year (do not use outdated static prices).
Prefer affordable staples when budget is tight.
The sum of item estimated_price values must not exceed remaining grocery budget when provided; if budget is very tight, suggest fewer cheaper items.
Return JSON:
- "title": short plan name
- "summary": 2 sentences (mention budget fit)
- "meals": array of 3 dinner/lunch ideas using what they have when possible
- "items": array of { "name", "category", "quantity", "estimated_price" }
  category must be one of: produce, protein, dairy, grains, pantry, snacks, drinks, household, other
  Prefer 6–12 shopping items. Avoid duplicates already clearly on the open grocery list.
- "budget_note": 1 sentence on how this list fits the allotted budget
- "estimated_total": number (sum of item prices)

${catalogHintForPrompt()}

USER CONTEXT:
${context}`);

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const normalized = items.slice(0, 12).map((item) => {
    const name = String(item?.name ?? "Item").slice(0, 80);
    const quantity = String(item?.quantity ?? "1").slice(0, 40);
    const rawCat = String(item?.category ?? "other");
    const guessed = suggestGroceryCategory(name);
    const category =
      rawCat === "other" || (rawCat === "produce" && guessed !== "produce")
        ? guessed
        : rawCat;
    const aiPrice = Number(item?.estimated_price);
    const catalog = estimateGroceryPrice(name, quantity, category);
    const estimated_price =
      Number.isFinite(aiPrice) && aiPrice > 0
        ? Math.round(aiPrice * 0.65 + catalog * 0.35)
        : catalog;
    return { name, category, quantity, estimated_price };
  });

  const estimated_total = normalized.reduce((sum, item) => sum + item.estimated_price, 0);

  return {
    title: String(parsed.title ?? "This week's smart list").slice(0, 120),
    summary: String(parsed.summary ?? "A few focused items to support your meals.").slice(0, 600),
    meals: (Array.isArray(parsed.meals) ? parsed.meals : []).map((m) => String(m).slice(0, 120)).slice(0, 5),
    items: normalized,
    estimated_total: Math.round(Number(parsed.estimated_total ?? estimated_total)),
    budget_note: String(
      parsed.budget_note ?? `List totals about ₱${estimated_total.toLocaleString("en-PH")}.`,
    ).slice(0, 300),
  };
}

export async function suggestWorkout(context: string): Promise<WorkoutSuggestion> {
  const parsed = await generateJson<Partial<WorkoutSuggestion>>(`Suggest ONE workout for today based on energy, mood, steps, goals, and routine_scaling.
Honor BMI band and pace forecast when present:
- underweight: prefer strength / short walks; avoid long hard cardio
- overweight / obese: prefer low-impact walk, cycle, yoga, or light strength; keep duration in session_minutes
- if suggested_kg_per_week is aggressive, keep today's session easier and sustainable
Mention BMI band or target-date pace briefly in "reason" when available.
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
  const parsed = await generateJson<Partial<GymPlanPayload>>(`Create a practical gym training plan for this user.
Use their profile, energy, goals, recent activity, and especially routine_scaling (BMI band + target-date forecast).
Scale the plan explicitly:
- Match days_per_week and session length to routine_scaling.days_per_week / session_minutes
- Match focus to routine_scaling.focus (map to full_body, strength, fat_loss, mobility, or endurance)
- underweight → strength / muscle gain, fewer long cardio blocks
- overweight / obese → joint-friendly machines first, controlled tempo, sustainable fat_loss or full_body
- If pace_note says the forecast is aggressive, do NOT amp intensity — keep volume moderate and note sustainability in summary
- Mention BMI band and target date (if any) in the summary
Prefer exercises from the available catalog when possible.
Include a healthy mix of machines (safer for beginners) and free-weight / bodyweight moves when appropriate.
Return JSON:
- "title"
- "focus": one of full_body, strength, fat_loss, mobility, endurance
- "level": beginner | intermediate | advanced
- "days_per_week": 2-5
- "summary": 2 sentences
- "days": array of { "day", "focus", "exercises": [{ "name", "sets", "rest", "notes" }] }
  Include 3–5 exercises per day. Name machines clearly when used (e.g. "Leg press machine").

AVAILABLE EXERCISES:
${availableExercises}

USER CONTEXT:
${context}`);

  const days = Array.isArray(parsed.days) ? parsed.days : [];
  return {
    title: String(parsed.title ?? "Your VIVRΛNT gym plan").slice(0, 120),
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
    body: String(parsed.body ?? "Keep logging weight weekly so VIVRΛNT can spot clearer patterns.").slice(0, 800),
    trend: String(parsed.trend ?? "Building history").slice(0, 80),
    next_step: String(parsed.next_step ?? "Log one weigh-in this week at the same time of day.").slice(0, 200),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 60)))),
  };
}

export type MachineRecommendation = {
  machine: string;
  why: string;
  how_to_use: string;
  sets: string;
  demo_slug: string | null;
  priority: number;
};

export type MachineRecommendationPayload = {
  title: string;
  summary: string;
  focus: string;
  recommendations: MachineRecommendation[];
};

export async function recommendGymMachines(
  context: string,
  machineCatalog: string,
): Promise<MachineRecommendationPayload> {
  const parsed = await generateJson<Partial<MachineRecommendationPayload>>(`Recommend gym machines for this user based on their profile, goals, energy, recent training, and routine_scaling (BMI + target-date pace).
For higher BMI bands prefer seated / supported machines and low-impact cardio machines. For underweight prefer strength machines that support progressive overload.
Prefer machines from the catalog. Mix strength machines and cardio machines when useful.
Return JSON:
- "title"
- "summary": 2 calm sentences
- "focus": short focus label like "Lower body strength" or "Beginner full gym"
- "recommendations": array of 4–6 items:
  { "machine", "why", "how_to_use", "sets", "demo_slug", "priority" }
  - "demo_slug" must match a catalog slug when possible, else null
  - "priority" 1 (highest) to 6
  - "sets" like "3 x 12" or "12 minutes steady"

MACHINE CATALOG (name | slug | muscle | equipment | difficulty):
${machineCatalog}

USER CONTEXT:
${context}`);

  const rows = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  return {
    title: String(parsed.title ?? "Your machine picks").slice(0, 120),
    summary: String(
      parsed.summary ?? "Start with guided machines for control, then add free weights as confidence grows.",
    ).slice(0, 500),
    focus: String(parsed.focus ?? "Balanced gym session").slice(0, 80),
    recommendations: rows.slice(0, 6).map((row, index) => ({
      machine: String(row?.machine ?? "Machine").slice(0, 80),
      why: String(row?.why ?? "Supports your current goal.").slice(0, 220),
      how_to_use: String(row?.how_to_use ?? "Use a light warm-up set, then work with control.").slice(0, 280),
      sets: String(row?.sets ?? "3 x 10").slice(0, 40),
      demo_slug: row?.demo_slug ? String(row.demo_slug).slice(0, 80) : null,
      priority: Math.max(1, Math.min(6, Math.round(Number(row?.priority ?? index + 1)))),
    })),
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

export async function generateSleepCoach(context: string): Promise<InsightPayload> {
  const parsed = await generateJson<Partial<InsightPayload>>(`You are VIVRΛNT sleep coach. Give ONE calm bedtime recommendation.
Return JSON: "title" (max 6 words), "body" (2 short sentences), "score" (0-100 rest readiness).
USER CONTEXT:
${context}`);
  return {
    title: String(parsed.title ?? "Protect your wind-down").slice(0, 60),
    body: String(
      parsed.body ?? "Dim screens 30 minutes before bed and keep a consistent wake time.",
    ).slice(0, 320),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 70)))),
  };
}

export async function generateMindfulnessTip(context: string): Promise<InsightPayload> {
  const parsed = await generateJson<Partial<InsightPayload>>(`You are VIVRΛNT mindfulness coach. Suggest ONE short calm practice for today.
Return JSON: "title" (max 6 words), "body" (2 calm sentences), "score" (0-100).
USER CONTEXT:
${context}`);
  return {
    title: String(parsed.title ?? "A quiet reset").slice(0, 60),
    body: String(
      parsed.body ?? "Take three slow breaths and notice one thing you can hear right now.",
    ).slice(0, 320),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 72)))),
  };
}

export async function generateHabitSuggestions(
  context: string,
): Promise<{ habits: { title: string; category: string; reason: string }[] }> {
  const parsed = await generateJson<{
    habits?: { title?: string; category?: string; reason?: string }[];
  }>(`Suggest 3 small daily habits for this member.
Return JSON: "habits": array of { "title", "category" (nutrition|movement|sleep|mindfulness|hydration|other), "reason" }.
USER CONTEXT:
${context}`);
  const rows = Array.isArray(parsed.habits) ? parsed.habits : [];
  return {
    habits: rows.slice(0, 3).map((h) => ({
      title: String(h?.title ?? "One small habit").slice(0, 80),
      category: String(h?.category ?? "other").slice(0, 40),
      reason: String(h?.reason ?? "Supports your current goals.").slice(0, 180),
    })),
  };
}

export async function generateJournalReflection(
  context: string,
  entries: string,
): Promise<InsightPayload> {
  const parsed = await generateJson<Partial<InsightPayload>>(`Reflect on these journal entries with warmth. No diagnosis.
Return JSON: "title", "body" (3 short sentences), "score" (0-100 emotional clarity).
USER CONTEXT:
${context}

RECENT ENTRIES:
${entries}`);
  return {
    title: String(parsed.title ?? "What your notes whisper").slice(0, 80),
    body: String(
      parsed.body ?? "Your entries show care for yourself. Keep noticing small wins.",
    ).slice(0, 500),
    score: Math.min(100, Math.max(0, Math.round(Number(parsed.score ?? 70)))),
  };
}
