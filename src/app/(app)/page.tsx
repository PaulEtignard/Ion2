import Link from "next/link";
import { ArrowRight, Swords, UserPlus } from "lucide-react";
import { ClassIcon } from "@/components/game/icons";
import { RecommendationList } from "@/components/recommendation-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getCurrentPlayerContext } from "@/lib/current";
import { CLASS_INFO, getClass } from "@/lib/game-data";
import type { ClassIdT } from "@/lib/build-schema";
import { getTeamOverview } from "@/lib/services";
import { formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const [{ rows, team }, { current }] = await Promise.all([getTeamOverview(), getCurrentPlayerContext()]);

  if (!rows.length)
    return (
      <Card className="mx-auto max-w-xl text-center">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Bienvenue, Daevas !</CardTitle>
          <CardDescription>Commencez par ajouter les 5 membres de la team avec leur classe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/equipe">
              <UserPlus /> Ajouter les joueurs
            </Link>
          </Button>
        </CardContent>
      </Card>
    );

  const mine = current ? rows.find((r) => r.player.id === current.id) : null;
  const avgIl = Math.round(rows.reduce((s, r) => s + r.progress.itemLevel, 0) / rows.length);
  const capped = rows.filter((r) => r.progress.level >= 45).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">État des lieux de la team</h1>
          <p className="text-muted-foreground">
            {rows.length} joueurs · {capped} au niveau 45 · item level moyen {formatNumber(avgIl)}
          </p>
        </div>
        {!current && <p className="text-muted-foreground text-sm">Choisis ton perso en haut à droite pour voir tes objectifs.</p>}
      </div>

      {mine && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClassIcon classId={mine.player.classId as ClassIdT} size={28} />
              {mine.player.name}, voilà ce que tu devrais faire maintenant
            </CardTitle>
            <CardAction>
              <Button asChild variant="outline" size="sm">
                <Link href={`/joueurs/${mine.player.id}`}>
                  Ma progression <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <RecommendationList items={mine.recommendations.filter((r) => !r.done)} limit={5} />
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @6xl/main:grid-cols-3">
        {rows.map(({ player, progress, recommendations, dailyRatio, weeklyRatio }) => {
          const cls = getClass(player.classId as ClassIdT);
          const info = CLASS_INFO[player.classId as ClassIdT];
          const median = cls.meta.medianCombatPower;
          return (
            <Link key={player.id} href={`/joueurs/${player.id}`} className="group">
              <Card className="group-hover:border-primary/50 h-full transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <ClassIcon classId={player.classId as ClassIdT} size={40} />
                    <div>
                      <div className="text-lg">{player.name}</div>
                      <div className="text-muted-foreground text-xs font-normal">
                        {info.fr} · {info.role}
                      </div>
                    </div>
                  </CardTitle>
                  <CardAction>
                    <Badge variant={progress.level >= 45 ? "default" : "secondary"}>Niv. {progress.level}</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <Stat label="Item level" value={formatNumber(progress.itemLevel)} />
                    <Stat
                      label="Puissance"
                      value={formatNumber(progress.combatPower)}
                      hint={median ? `médiane top joueurs : ${formatNumber(median)}` : undefined}
                    />
                  </div>
                  {dailyRatio != null && <Bar label="Quotidiennes" value={dailyRatio} />}
                  {weeklyRatio != null && <Bar label="Hebdomadaires" value={weeklyRatio} />}
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">Prochaines étapes</p>
                    <RecommendationList items={recommendations.filter((r) => !r.done)} limit={3} compact />
                  </div>
                  {player.progress?.build ? (
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Swords className="size-3" /> Build : {player.progress.build.title}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-400">Aucun build suivi</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      {team.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>À faire ensemble</CardTitle>
            <CardDescription>Suggestions calculées à partir du niveau et de l&apos;item level de chacun.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecommendationList items={team} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-black/20 p-2" title={hint}>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-[11px]">{label}</div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <Progress value={pct} className={pct >= 100 ? "[&>[data-slot=progress-indicator]]:bg-success" : undefined} />
    </div>
  );
}
