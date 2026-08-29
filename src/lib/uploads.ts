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

const HEIC_BRANDS = new Set(["heic", "heix", "heif", "heim", "mif1", "msf1"]);

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.subarray(start, end));
}

export function isHeicUpload(file: { type?: string; name?: string }): boolean {
  const type = String(file.type ?? "").toLowerCase();
  const name = String(file.name ?? "").toLowerCase();
  return type.includes("heic") || type.includes("heif") || /\.hei[cf]$/.test(name);
}

export function isHeicBuffer(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  if (ascii(bytes, 4, 8) !== "ftyp") return false;
  return HEIC_BRANDS.has(ascii(bytes, 8, 12).toLowerCase());
}

/** Inspect magic bytes so a HEIC file labeled as JPEG cannot sneak through. */
export function sniffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  return null;
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

/**
 * Trust file contents first, then the declared type/name.
 * Rejects HEIC even when the client labeled it as JPEG.
 */
export function resolveUploadedImageMime(
  file: { type?: string; name?: string },
  bytes: Uint8Array,
): string | null {
  if (isHeicUpload(file) || isHeicBuffer(bytes)) return null;
  return sniffImageMime(bytes) ?? mimeFromUpload(file);
}

export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
export const MEAL_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
