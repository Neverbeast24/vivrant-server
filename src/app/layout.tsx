import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { THEME_COOKIE, isThemePreference, themeBootScript } from "@/lib/theme";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const accentFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-accent",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1210" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "VIVRΛNT — Long live life",
    template: "%s · VIVRΛNT",
  },
  description:
    "VIVRΛNT — Long live life. A calm, intelligent health workspace for nutrition, movement, goals, and everyday wellbeing.",
  icons: {
    icon: "/vivrant-mark.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;
  const initialTheme = isThemePreference(cookieTheme) ? cookieTheme : null;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${accentFont.variable} ${bodyFont.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <Providers initialTheme={initialTheme}>{children}</Providers>
      </body>
    </html>
  );
}
