"use client";

import { useTransition } from "react";
import { toast } from "sonner";

export function useModuleAction(
  action: (formData: FormData) => Promise<{ ok: boolean; message: string }>,
) {
  const [pending, start] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      const result = await action(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return { pending, submit };
}
