const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isHeicUpload(file: { type?: string; name?: string }): boolean {
  const type = String(file.type ?? "").toLowerCase();
  const name = String(file.name ?? "").toLowerCase();
  return type.includes("heic") || type.includes("heif") || /\.hei[cf]$/.test(name);
}

export function imageUploadError(file: { type?: string; name?: string }): string {
  if (isHeicUpload(file)) {
    return "iPhone HEIC photos aren't supported. Export as JPG or PNG first.";
  }
  return "Use a JPG, PNG, WEBP, or GIF image.";
}

/** Phone cameras often send an empty MIME type; fall back to the filename. */
export function mimeFromUpload(file: { type?: string; name?: string }): string | null {
  const type = String(file.type ?? "").toLowerCase().trim();
  if (ALLOWED_IMAGE_MIME.has(type)) {
    return type === "image/jpg" ? "image/jpeg" : type;
  }
  const name = String(file.name ?? "");
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_MIME_BY_EXT[ext] ?? null;
}

export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
export const MEAL_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
