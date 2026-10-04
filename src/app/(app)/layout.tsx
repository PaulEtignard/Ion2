import { cookies } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { isTeamMember } from "@/lib/auth";
import { getCurrentPlayerContext } from "@/lib/current";
import { CLASS_INFO, GAME_META } from "@/lib/game-data";
import type { ClassIdT } from "@/lib/build-schema";
import { PageTitle } from "@/components/page-title";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await isTeamMember();
  const { players, current } = member ? await getCurrentPlayerContext() : { players: [], current: null };
  const lite = (p: { id: string; name: string; classId: string }) => ({
    id: p.id,
    name: p.name,
    classId: p.classId,
    classFr: CLASS_INFO[p.classId as ClassIdT].fr,
  });
  const defaultOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar member={member} players={players.map(lite)} current={current ? lite(current) : null} syncedAt={GAME_META.syncedAt.slice(0, 10)} />
      <SidebarInset className="app-backdrop">
        <header className="bg-background/70 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <PageTitle />
        </header>
        <div className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
