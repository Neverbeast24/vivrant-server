import { describe, expect, it } from "vitest";
import { imageUploadError, mimeFromUpload } from "./uploads";

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

describe("imageUploadError", () => {
  it("explains HEIC photos", () => {
    expect(imageUploadError({ type: "image/heic", name: "IMG_0001.HEIC" })).toMatch(/HEIC/);
  });
});
