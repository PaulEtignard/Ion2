"use client";

import { usePathname } from "next/navigation";

const TITLES: [string, string][] = [
  ["/joueurs", "Progression"],
  ["/builds", "Builds"],
  ["/classes", "Classes"],
  ["/activites", "Activités"],
  ["/equipe", "Équipe"],
];

/** Titre de section affiché dans l'en-tête, à côté du bouton de la barre latérale */
export function PageTitle() {
  const pathname = usePathname();
  const title = pathname === "/" ? "Tableau de bord" : (TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "");
  return <span className="text-sm font-medium">{title}</span>;
}
