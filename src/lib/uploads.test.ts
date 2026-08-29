import { describe, expect, it } from "vitest";
import {
  imageUploadError,
  isHeicBuffer,
  mimeFromUpload,
  resolveUploadedImageMime,
  sniffImageMime,
} from "./uploads";

describe("mimeFromUpload", () => {
  it("trusts a valid MIME type", () => {
    expect(mimeFromUpload({ type: "image/png", name: "shot.jpg" })).toBe("image/png");
    expect(mimeFromUpload({ type: "image/jpg", name: "shot.jpg" })).toBe("image/jpeg");
  });

  it("falls back to the filename when MIME is empty", () => {
    expect(mimeFromUpload({ type: "", name: "meal.JPEG" })).toBe("image/jpeg");
    expect(mimeFromUpload({ type: "application/octet-stream", name: "avatar.webp" })).toBe(
      "image/webp",
    );
  });

  it("rejects unknown types", () => {
    expect(mimeFromUpload({ type: "image/heic", name: "IMG_0001.HEIC" })).toBeNull();
    expect(mimeFromUpload({ type: "", name: "notes.pdf" })).toBeNull();
  });
});

describe("sniffImageMime", () => {
  it("detects jpeg / png / gif / webp magic bytes", () => {
    expect(sniffImageMime(Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe(
      "image/jpeg",
    );
    expect(sniffImageMime(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0))).toBe(
      "image/png",
    );
    expect(sniffImageMime(Uint8Array.from(Buffer.from("GIF89aXXXXXX")))).toBe("image/gif");
    const webp = new Uint8Array(12);
    webp.set(Buffer.from("RIFF"));
    webp.set(Buffer.from("WEBP"), 8);
    expect(sniffImageMime(webp)).toBe("image/webp");
  });

  it("does not treat HEIC as an allowed image", () => {
    const heic = new Uint8Array(12);
    heic.set(Buffer.from("ftyp"), 4);
    heic.set(Buffer.from("heic"), 8);
    expect(isHeicBuffer(heic)).toBe(true);
    expect(sniffImageMime(heic)).toBeNull();
  });
});

describe("resolveUploadedImageMime", () => {
  it("prefers sniffed bytes over a lying Content-Type", () => {
    const jpeg = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0);
    expect(resolveUploadedImageMime({ type: "image/png", name: "meal.png" }, jpeg)).toBe(
      "image/jpeg",
    );
  });

  it("rejects HEIC bytes even when labeled JPEG", () => {
    const heic = new Uint8Array(12);
    heic.set(Buffer.from("ftyp"), 4);
    heic.set(Buffer.from("heic"), 8);
    expect(resolveUploadedImageMime({ type: "image/jpeg", name: "avatar.jpg" }, heic)).toBeNull();
  });
});

describe("imageUploadError", () => {
  it("explains HEIC photos", () => {
    expect(imageUploadError({ type: "image/heic", name: "IMG_0001.HEIC" })).toMatch(/HEIC/);
  });
});
