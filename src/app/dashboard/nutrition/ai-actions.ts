"use server";

import { z } from "zod";
import { buildUserContext } from "@/lib/ai/context";
import { estimateMealMacros, type MealImageInput } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function readMealImage(formData: FormData): Promise<MealImageInput | undefined> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return undefined;

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Use a JPG, PNG, WEBP, or GIF photo of the meal.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Meal photo must be under 4MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    mimeType: file.type === "image/jpg" ? "image/jpeg" : file.type,
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

  try {
    const context = await buildUserContext(user.id);
    const estimate = await estimateMealMacros(description || "Meal from photo", context, image);
    return {
      ok: true,
      message: image
        ? "Macros estimated from your photo — review and log the meal."
        : "Macros estimated — review and log the meal.",
      estimate,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not estimate this meal.";
    return { ok: false, message };
  }
}
