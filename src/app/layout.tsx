import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans-loaded" });
const display = Cinzel({ subsets: ["latin"], variable: "--font-display-loaded", weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "Team AION 2", template: "%s · Team AION 2" },
  description: "Builds, progression et objectifs de la team sur AION 2 (serveur global).",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`dark ${sans.variable} ${display.variable}`}>
      <body className="font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
