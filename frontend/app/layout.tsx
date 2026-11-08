import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { CountsProvider } from "@/lib/counts";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TaskFlow — Calm, bilingual task management",
    template: "%s · TaskFlow",
  },
  description:
    "A calm, bilingual (English / Arabic) task manager with priorities, due dates, board view, and keyboard-first workflows.",
};

/**
 * Runs before hydration so the correct theme, language and direction are
 * applied on the very first paint (no white flash, no LTR jump for Arabic).
 */
const bootScript = `
(function () {
  try {
    var theme = localStorage.getItem("theme") || "system";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
    var lang = localStorage.getItem("lang") || "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${plexArabic.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full bg-canvas text-ink antialiased">
        <StoreProvider>
          <ToastProvider>
            <CountsProvider>{children}</CountsProvider>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
