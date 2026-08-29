"use server";

import { z } from "zod";
import { buildUserContext } from "@/lib/ai/context";
import {
  estimateMealMacros,
  suggestMeal,
  type MealImageInput,
} from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { MEAL_PHOTO_MAX_BYTES, imageUploadError, resolveUploadedImageMime } from "@/lib/uploads";

async function readMealImage(formData: FormData): Promise<MealImageInput | undefined> {
  const file = formData.get("photo") ?? formData.get("image") ?? formData.get("file");
  if (!(file instanceof File) || file.size === 0) return undefined;

  if (file.size > MEAL_PHOTO_MAX_BYTES) {
    throw new Error("Meal photo must be under 4MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = resolveUploadedImageMime(file, buffer);
  if (!mime) {
    throw new Error(imageUploadError(file));
  }
  return {
    mimeType: mime,
    base64: buffer.toString("base64"),
  };
}

export async function estimateMealWithAi(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  let image: MealImageInput | undefined;

  try {
    image = await readMealImage(formData);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not read that photo.",
    };
  }

  if (description.length < 2 && !image) {
    return {
      ok: false,
      message: "Describe the meal or attach a photo first.",
    };
  }

  if (description.length > 240) {
    return { ok: false, message: "Keep the description under 240 characters." };
  }

  // Keep zod for typed description when present.
  if (description) {
    const parsed = z.string().trim().min(2).max(240).safeParse(description);
    if (!parsed.success) {
      return { ok: false, message: "Describe the meal first (e.g. chicken rice bowl)." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const portionRaw = String(formData.get("portion") ?? "typical").toLowerCase();
  const portion =
    portionRaw === "small" || portionRaw === "typical" || portionRaw === "large"
      ? portionRaw
      : "typical";

  try {
    const context = await buildUserContext(user.id);
    const estimate = await estimateMealMacros(
      description || "Meal from photo",
      context,
      image,
      portion,
    );
    return {
      ok: true,
      message: image
        ? "Rough macros from your photo — tweak if needed, then log."
        : "Rough macros filled in — tweak if needed, then log.",
      estimate,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not estimate this meal.";
    return { ok: false, message };
  }
}

export async function suggestMealWithAi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  try {
    const context = await buildUserContext(user.id);
    const suggestion = await suggestMeal(context);
    return { ok: true, message: "Meal suggestion ready.", suggestion };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not suggest a meal.";
    return { ok: false, message };
  }
}
