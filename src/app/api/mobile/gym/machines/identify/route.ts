import { requireMobileUser, isMobileAuthError } from "@/lib/mobile/auth";
import { jsonOk, jsonError } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { buildUserContext } from "@/lib/ai/context";
import { identifyGymMachineFromPhoto } from "@/lib/ai/gemini";
import {
  formatMachineCatalogForAi,
  sanitizeMachineDetection,
  type MachineCatalogRow,
} from "@/lib/gym-machine-detect";
import {
  checkRateLimit,
  clientIp,
  maybeSweepRateLimits,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import {
  MACHINE_PHOTO_MAX_BYTES,
  imageUploadError,
  readUploadedImageFile,
} from "@/lib/uploads";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Identify a gym machine from a member photo and map it onto the catalog. */
export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  maybeSweepRateLimits();
  const limited = checkRateLimit(`ai:machine-identify:${user.id}:${clientIp(request)}`, {
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("Attach a photo of the machine first.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Could not read that photo.", 400);
  }

  const file = formData.get("photo") ?? formData.get("image") ?? formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Attach a photo of the machine first.");
  }

  try {
    const image = await readUploadedImageFile(file, {
      maxBytes: MACHINE_PHOTO_MAX_BYTES,
      tooLargeMessage: "Machine photo must be under 4MB.",
    });

    const [{ data: machines }, context] = await Promise.all([
      supabase
        .from("gym_exercises")
        .select("slug, name, muscle_group, equipment, difficulty, cues")
        .in("equipment", ["machine", "cable", "cardio_machine"])
        .order("name"),
      buildUserContext(user.id, { supabase }),
    ]);
    const catalogRows = (machines ?? []) as MachineCatalogRow[];
    const catalog =
      formatMachineCatalogForAi(catalogRows) ||
      "Leg press machine | leg-press | legs | machine | beginner\nLat pulldown machine | lat-pulldown | back | machine | beginner";
    const raw = await identifyGymMachineFromPhoto(image, catalog, context);
    const detection = sanitizeMachineDetection(raw, catalogRows);
    const matched = catalogRows.find((row) => row.slug === detection.demo_slug) ?? null;

    await writeAuditLog(
      {
        action: "gym_machine_identified",
        entity: "gym_exercises",
        metadata: {
          found: detection.found,
          slug: detection.demo_slug,
          confidence: detection.confidence,
        },
      },
      supabase,
    );

    return jsonOk({
      detection,
      exercise: matched,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not identify that machine.";
    const status = message.includes("4MB") || message === imageUploadError(file as File) ? 400 : 502;
    return jsonError(message, status);
  }
}
