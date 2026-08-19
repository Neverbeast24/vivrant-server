import { z } from "zod";
import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk, readJson } from "@/lib/mobile/http";
import { buildUserContext } from "@/lib/ai/context";
import { estimateMealMacros, type MealImageInput } from "@/lib/ai/gemini";
import {
  checkRateLimit,
  clientIp,
  maybeSweepRateLimits,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { MEAL_PHOTO_MAX_BYTES, imageUploadError, mimeFromUpload } from "@/lib/uploads";

export const runtime = "nodejs";

const estimateSchema = z.object({
  description: z.string().trim().max(240).optional().default(""),
});

async function readMealImage(formData: FormData): Promise<MealImageInput | undefined> {
  const file = formData.get("photo") ?? formData.get("image") ?? formData.get("file");
  if (!(file instanceof File) || file.size === 0) return undefined;
  const mime = mimeFromUpload(file);
  if (!mime) {
    throw new Error(imageUploadError(file));
  }
  if (file.size > MEAL_PHOTO_MAX_BYTES) {
    throw new Error("Meal photo must be under 4MB.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    mimeType: mime,
    base64: buffer.toString("base64"),
  };
}

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  maybeSweepRateLimits();
  const limited = checkRateLimit(`ai:estimate:${user.id}:${clientIp(request)}`, {
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const contentType = request.headers.get("content-type") ?? "";
  let description = "";
  let image: MealImageInput | undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      description = String(formData.get("description") ?? "").trim();
      image = await readMealImage(formData);
    } else {
      const body = await readJson(request);
      if (body === null) return jsonError("Invalid JSON body.");
      const parsed = estimateSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError("Describe the meal in up to 240 characters.");
      }
      description = parsed.data.description;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not read that photo.";
    return jsonError(message, 400);
  }

  if (description.length < 2 && !image) {
    return jsonError("Describe the meal or attach a photo first.");
  }

  const context = await buildUserContext(user.id, { supabase });

  try {
    const estimate = await estimateMealMacros(
      description || "Meal from photo",
      context,
      image,
    );
    return jsonOk({
      summary: estimate.tip,
      calories: estimate.calories,
      protein_g: estimate.protein_g,
      carbs_g: estimate.carbs_g,
      fat_g: estimate.fat_g,
      meal_name: estimate.meal_name,
      meal_type: estimate.meal_type,
      from_photo: Boolean(image),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not estimate meal macros.";
    return jsonError(message, 502);
  }
}
