import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const viewport: Viewport = {
  colorScheme: "light",
};

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
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
