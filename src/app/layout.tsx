import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans-loaded" });
const display = Cinzel({ subsets: ["latin"], variable: "--font-display-loaded", weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "WARLORD · AION 2", template: "%s · WARLORD" },
  description: "WARLORD — builds détaillés et progression de la team sur AION 2 (serveur global).",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
