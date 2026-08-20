"use client";

import { Toaster } from "sonner";
import { ConfirmHost } from "@/components/dashboard/confirm-dialog";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import type { ThemePreference } from "@/lib/theme";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme}
    />
  );
}

export function Providers({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemePreference | null;
}) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      {children}
      <ConfirmHost />
      <ThemedToaster />
    </ThemeProvider>
  );
}
