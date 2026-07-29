export const runtime = "nodejs";

import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Expected multipart form-data.", 400);
  }

  const file = formData.get("file") ?? formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose an image to upload.", 400);
  }

  const ext = ALLOWED_EXT[file.type];
  if (!ext) {
    return jsonError("Use a JPG, PNG, WEBP, or GIF image.", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("Image must be 5MB or smaller.", 400);
  }

  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });
  if (uploadError) return jsonError(uploadError.message, 400);

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);
  if (profileError) return jsonError(profileError.message, 400);

  await writeAuditLog(
    { action: "avatar_updated", entity: "profiles", entityId: user.id, metadata: { path } },
    supabase,
  );

  return jsonOk({ avatar_url: avatarUrl });
}

export async function DELETE(request: Request) {
  const auth = await requireMobileUser(request);
  if (isMobileAuthError(auth)) return auth;
  const { supabase, user } = auth;

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files?.length) {
    await supabase.storage
      .from("avatars")
      .remove(files.map((file) => `${user.id}/${file.name}`));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("user_id", user.id);
  if (error) return jsonError(error.message, 400);

  await writeAuditLog(
    { action: "avatar_removed", entity: "profiles", entityId: user.id },
    supabase,
  );

  return jsonOk({ avatar_url: null });
}
