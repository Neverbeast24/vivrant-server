import { isMobileAuthError, requireMobileUser } from "@/lib/mobile/auth";
import { jsonError, jsonOk } from "@/lib/mobile/http";
import { writeAuditLog } from "@/lib/audit";
import { AVATAR_MAX_BYTES, imageUploadError, mimeFromUpload } from "@/lib/uploads";

export const runtime = "nodejs";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
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

  const mime = mimeFromUpload(file);
  if (!mime) {
    return jsonError(imageUploadError(file), 400);
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return jsonError("Image must be 4MB or smaller.", 400);
  }

  const ext = EXT[mime] ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });
  if (uploadError) {
    return jsonError("Could not save that photo. Try a smaller JPG or PNG.", 400);
  }

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
