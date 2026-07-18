import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VIVA — Virtual Intelligent Vitality Assistant",
    template: "%s · VIVA",
  },
  description:
    "A calm, intelligent health workspace for nutrition, movement, goals, and everyday wellbeing.",
  icons: {
    icon: "/viva-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
