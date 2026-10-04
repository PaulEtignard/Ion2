import Link from "next/link";
import { Bot } from "lucide-react";
import { ClassIcon, SkillIcon } from "@/components/game/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CLASS_IDS, type BuildData, type ClassIdT } from "@/lib/build-schema";
import { CLASS_INFO } from "@/lib/game-data";
import { isClassId, listBuilds } from "@/lib/services";
import { cn } from "@/lib/utils";

export const metadata = { title: "Builds" };

const MODE_LABEL = { PVE: "PvE", PVP: "PvP", HYBRID: "Hybride" } as const;

export default async function BuildsPage({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const { classe } = await searchParams;
  const classId = isClassId(classe) ? classe : undefined;
  const builds = await listBuilds({ classId });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Builds</h1>
        <p className="text-muted-foreground">Les meilleurs builds de nos classes, basés sur les données du client global et des meilleurs joueurs.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/builds" active={!classId}>
          Toutes
        </FilterChip>
        {CLASS_IDS.map((c) => (
          <FilterChip key={c} href={`/builds?classe=${c}`} active={classId === c}>
            <ClassIcon classId={c} size={18} /> {CLASS_INFO[c].fr}
          </FilterChip>
        ))}
      </div>

      {builds.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5" /> Aucun build pour l&apos;instant
            </CardTitle>
            <CardDescription>
              Les builds se créent via le serveur MCP (outil <code>create_build</code>) : demande à Claude de créer un build pour cette classe.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {builds.map((b) => {
            const data = b.data as BuildData;
            const core = [...data.skills].sort((x, y) => x.priority - y.priority).slice(0, 5);
            return (
              <Link key={b.id} href={`/builds/${b.slug}`} className="group">
                <Card className="group-hover:border-primary/50 h-full transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <ClassIcon classId={b.classId as ClassIdT} size={36} />
                      <span className="text-lg">{b.title}</span>
                    </CardTitle>
                    <CardDescription className="flex flex-wrap gap-1.5 pt-1">
                      <Badge>{MODE_LABEL[b.mode]}</Badge>
                      {b.role && <Badge variant="secondary">{b.role}</Badge>}
                      {b.featured && <Badge variant="success">Recommandé</Badge>}
                      {b.tags.map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">{b.summary}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {core.map((s) => (
                        <SkillIcon key={s.skillId} id={s.skillId} size={36} />
                      ))}
                      <span className="text-muted-foreground mx-1">·</span>
                      {[...data.stigmas]
                        .sort((x, y) => x.slot - y.slot)
                        .map((s) => (
                          <SkillIcon key={s.stigmaId} id={s.stigmaId} size={36} />
                        ))}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Par {b.author} · mis à jour le {b.updatedAt.toLocaleDateString("fr-FR")}
                      {b.patch && ` · client ${b.patch}`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        active ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
