"use server";

import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { AVATAR_MAX_BYTES, imageUploadError, resolveUploadedImageMime } from "@/lib/uploads";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image to upload." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, message: "Image must be 4MB or smaller." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = resolveUploadedImageMime(file, buffer);
  if (!mime) {
    return { ok: false, message: imageUploadError(file) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const ext = EXT[mime] ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, buffer, {
    contentType: mime,
    upsert: true,
    cacheControl: "3600",
  });
  if (uploadError) {
    return { ok: false, message: "Could not save that photo. Try a smaller JPG or PNG." };
  }

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);
  if (profileError) return { ok: false, message: profileError.message };

  await writeAuditLog({
    action: "avatar_updated",
    entity: "profiles",
    entityId: user.id,
    metadata: { path },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath("/admin");
  return { ok: true, message: "Avatar updated.", avatarUrl };
}

export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

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
  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    action: "avatar_removed",
    entity: "profiles",
    entityId: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Avatar removed." };
}
