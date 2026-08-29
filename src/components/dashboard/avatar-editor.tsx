"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/dashboard/confirm-dialog";
import { removeAvatar, uploadAvatar } from "@/app/dashboard/settings/avatar-actions";
import { PrimaryButton } from "@/components/dashboard/ui";

export function AvatarEditor({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [pending, start] = useTransition();
  const initials = displayName.trim().charAt(0).toUpperCase() || "V";

  function onFileChange(file: File | undefined) {
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";
    const localUrl = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return localUrl;
    });

    const formData = new FormData();
    formData.set("avatar", file);
    start(async () => {
      const result = await uploadAvatar(formData);
      URL.revokeObjectURL(localUrl);
      if (result.ok && "avatarUrl" in result && result.avatarUrl) {
        setPreview(result.avatarUrl);
        toast.success(result.message);
      } else {
        setPreview(avatarUrl);
        toast.error(result.message);
      }
    });
  }

  function onRemove() {
    start(async () => {
      if (
        !(await confirmAction({
          title: "Remove avatar?",
          body: "Your profile photo will be cleared.",
          confirmLabel: "Remove",
        }))
      )
        return;
      const result = await removeAvatar();
      if (result.ok) {
        setPreview(null);
        toast.success(result.message);
      } else toast.error(result.message);
    });
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-[1.4rem] border border-ink/8 bg-surface/45 p-5 sm:flex-row sm:items-start">
      <div className="relative">
        {preview ? (
          <Image
            src={preview}
            alt=""
            width={96}
            height={96}
            unoptimized
            className="size-24 rounded-full border-2 border-white object-cover shadow-md"
          />
        ) : (
          <span className="grid size-24 place-items-center rounded-full bg-gradient-to-br from-accent to-cyan text-2xl font-black text-accent-fg shadow-md">
            {initials}
          </span>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-inverse text-inverse-fg shadow-lg transition hover:bg-accent disabled:opacity-60"
          title="Change avatar"
        >
          <Camera size={15} />
        </button>
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-sm font-black">{displayName}</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Upload a square photo (JPG, PNG, WEBP, or GIF · max 4MB).
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <PrimaryButton
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="rounded-full px-4 py-2 text-xs"
          >
            {pending ? "Uploading…" : "Change avatar"}
          </PrimaryButton>
          {preview && (
            <button
              type="button"
              disabled={pending}
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-ember/20 bg-ember/10 px-4 py-2 text-xs font-black text-ember disabled:opacity-60"
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0])}
      />
    </div>
  );
}
