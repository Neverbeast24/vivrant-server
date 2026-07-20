import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?error=" + encodeURIComponent("Your reset link has expired. Request a new one."));
  }

  return (
    <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
      <Brand />
      <div className="animate-rise mx-auto my-auto w-full max-w-md py-14">
        <p className="text-xs font-black tracking-[0.18em] text-[#0e7c66]">ALMOST THERE</p>
        <h1 className="font-display mt-4 text-5xl">Choose a new password.</h1>
        <p className="mt-4 text-sm leading-6 text-[#7b7682]">
          You&apos;re verified{data.user.email ? ` as ${data.user.email}` : ""}. Pick a
          password you haven&apos;t used before.
        </p>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
