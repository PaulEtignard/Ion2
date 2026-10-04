"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { BookOpen, CalendarCheck, ChevronsUpDown, LayoutDashboard, LogIn, LogOut, Swords, User, Users } from "lucide-react";
import { logout, selectPlayer } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type PlayerLite = { id: string; name: string; classId: string; classFr: string };

export function AppSidebar({
  member,
  players,
  current,
  syncedAt,
}: {
  member: boolean;
  players: PlayerLite[];
  current: PlayerLite | null;
  syncedAt: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const teamNav = [
    { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
    ...(current ? [{ href: `/joueurs/${current.id}`, label: "Ma progression", icon: User }] : []),
    { href: "/activites", label: "Activités", icon: CalendarCheck },
    { href: "/equipe", label: "Équipe", icon: Users },
  ];
  const guideNav = [
    { href: "/builds", label: "Builds", icon: Swords },
    { href: "/classes", label: "Classes", icon: BookOpen },
  ];

  const menu = (items: typeof guideNav) => (
    <SidebarMenu>
      {items.map((n) => (
        <SidebarMenuItem key={n.href}>
          <SidebarMenuButton asChild isActive={isActive(n.href)} tooltip={n.label} onClick={() => setOpenMobile(false)}>
            <Link href={n.href}>
              <n.icon />
              <span>{n.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={member ? "/" : "/builds"}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.svg" alt="" className="size-8 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 flex-1 text-left leading-tight">
                  <span className="font-display text-primary truncate font-bold">Team AION 2</span>
                  <span className="text-muted-foreground truncate text-xs">Serveur global</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {member && (
          <SidebarGroup>
            <SidebarGroupLabel>Team</SidebarGroupLabel>
            <SidebarGroupContent>{menu(teamNav)}</SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Guides</SidebarGroupLabel>
          <SidebarGroupContent>{menu(guideNav)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="text-muted-foreground px-2 text-[11px] leading-snug group-data-[collapsible=icon]:hidden">
          Données du client global ({syncedAt}). Icônes © NCSOFT.
        </p>
        {member ? (
          <PlayerMenu players={players} current={current} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Espace team">
                <Link href="/login">
                  <LogIn />
                  <span>Espace team</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function ClassAvatar({ classId, name, className }: { classId?: string; name: string; className?: string }) {
  return (
    <Avatar className={className ?? "size-8 rounded-lg"}>
      {classId && <AvatarImage src={`/game/classes/${classId}.webp`} alt="" />}
      <AvatarFallback className="rounded-lg">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function PlayerMenu({ players, current }: { players: PlayerLite[]; current: PlayerLite | null }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (id: string) =>
    start(async () => {
      await selectPlayer(id);
      router.refresh();
    });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" disabled={pending} className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <ClassAvatar classId={current?.classId} name={current?.name ?? "?"} />
              <div className="grid grid-cols-1 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{current?.name ?? "Choisir mon perso"}</span>
                <span className="text-muted-foreground truncate text-xs">{current ? current.classFr : "Je suis…"}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="text-muted-foreground text-xs">Je suis</DropdownMenuLabel>
            <DropdownMenuGroup>
              {players.map((p) => (
                <DropdownMenuItem key={p.id} onSelect={() => choose(p.id)} className="gap-2">
                  <ClassAvatar classId={p.classId} name={p.name} className="size-6 rounded-md" />
                  <span className="flex-1 truncate">{p.name}</span>
                  {current?.id === p.id && <span className="text-primary text-xs">actif</span>}
                </DropdownMenuItem>
              ))}
              {!players.length && (
                <DropdownMenuItem asChild>
                  <Link href="/equipe">Ajouter les joueurs…</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => start(() => logout())}>
              <LogOut />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
