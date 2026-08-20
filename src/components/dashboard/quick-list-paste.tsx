"use client";

import { useState } from "react";
import { PrimaryButton, fieldClass } from "@/components/dashboard/ui";

export function QuickListPaste({
  pending,
  onSubmit,
  placeholder = "eggs\nmilk\nrice 5kg",
  hint = "One item per line. You can also paste from Excel (tabs or commas).",
  submitLabel = "Add all",
}: {
  pending: boolean;
  onSubmit: (text: string) => void | boolean | Promise<void | boolean>;
  placeholder?: string;
  hint?: string;
  submitLabel?: string;
}) {
  const [text, setText] = useState("");
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;

  return (
    <div className="grid gap-3">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={7}
        placeholder={placeholder}
        className={`${fieldClass} min-h-[9rem] resize-y font-mono text-sm`}
      />
      <p className="text-xs leading-5 text-muted">{hint}</p>
      <PrimaryButton
        type="button"
        disabled={pending || !text.trim()}
        onClick={async () => {
          try {
            const result = await onSubmit(text);
            if (result === false) return;
            setText("");
          } catch {
            /* keep the paste so a failed add can be retried */
          }
        }}
      >
        {pending ? "Adding…" : `${submitLabel}${lines ? ` · ${lines}` : ""}`}
      </PrimaryButton>
    </div>
  );
}
