import Link from "next/link";
import { BookOpen, CalendarCheck, LayoutDashboard, LogOut, Swords, User, Users } from "lucide-react";
import { logout } from "@/app/actions";
import { PlayerSwitcher } from "@/components/player-switcher";
import { NavLink } from "@/components/nav-link";
import { getCurrentPlayerContext } from "@/lib/current";
import { GAME_META } from "@/lib/game-data";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { players, current } = await getCurrentPlayerContext();
  const nav = [
    { href: "/", label: "Tableau de bord", icon: <LayoutDashboard /> },
    ...(current ? [{ href: `/joueurs/${current.id}`, label: "Ma progression", icon: <User /> }] : []),
    { href: "/builds", label: "Builds", icon: <Swords /> },
    { href: "/classes", label: "Classes", icon: <BookOpen /> },
    { href: "/activites", label: "Activités", icon: <CalendarCheck /> },
    { href: "/equipe", label: "Équipe", icon: <Users /> },
  ];
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="bg-sidebar/80 border-b backdrop-blur md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2 p-4 md:block">
          <Link href="/" className="font-display text-primary text-xl font-bold">
            Team AION 2
          </Link>
          <p className="text-muted-foreground hidden text-xs md:block">Serveur global</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {nav.map((n) => (
            <NavLink key={n.href} href={n.href} icon={n.icon}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden p-4 md:absolute md:bottom-0 md:block md:w-full">
          <p className="text-muted-foreground mb-2 text-[11px] leading-snug">
            Données du client global ({GAME_META.syncedAt.slice(0, 10)}). Icônes © NCSOFT.
          </p>
          <form action={logout}>
            <button className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
              <LogOut className="size-4" /> Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/60 sticky top-0 z-30 flex items-center justify-end gap-3 border-b px-4 py-2 backdrop-blur md:px-8">
          <PlayerSwitcher
            players={players.map((p) => ({ id: p.id, name: p.name, classId: p.classId }))}
            currentId={current?.id ?? null}
          />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
