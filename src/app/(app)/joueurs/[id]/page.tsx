import Link from "next/link";
import { notFound } from "next/navigation";
import { Swords } from "lucide-react";
import { ActivityCounter } from "@/components/activity-counter";
import { GameIcon } from "@/components/game/game-icon";
import { ClassIcon, ItemIcon } from "@/components/game/icons";
import { ProgressChart } from "@/components/progress-chart";
import { ProgressForm, type ProgressFormProps } from "@/components/progress-form";
import { RecommendationList } from "@/components/recommendation-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ACTIVITIES, TRANSCENDENCE } from "@/data/activities";
import { GEAR_SLOT_LABELS, GEAR_SLOTS, type BuildData, type ClassIdT } from "@/lib/build-schema";
import { CLASS_INFO, getClass, ITEMS, slotCategory } from "@/lib/game-data";
import { getPlayerRecommendations, getSnapshots, listBuilds } from "@/lib/services";
import { formatNumber } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { player } = await getPlayerRecommendations(id);
    return { title: player.name };
  } catch {
    return { title: "Joueur" };
  }
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data;
  try {
    data = await getPlayerRecommendations(id);
  } catch {
    notFound();
  }
  const { player, progress, counts, recommendations } = data;
  const classId = player.classId as ClassIdT;
  const cls = getClass(classId);
  const info = CLASS_INFO[classId];
  const build = player.progress?.build ?? null;
  const buildData = build ? (build.data as BuildData) : null;
  const [snapshots, builds] = await Promise.all([getSnapshots(player.id), listBuilds({ classId })]);

  const relevant = ACTIVITIES.filter((a) => progress.level >= a.minLevel && (!a.minItemLevel || progress.itemLevel >= a.minItemLevel));
  const median = cls.meta.medianCombatPower ?? 0;

  // Comparaison équipement actuel vs build
  const gearCompare = buildData?.gear.map((g) => {
    const mine = progress.gear[g.slot];
    const ok = !!mine?.name && mine.name.toLowerCase() === g.name.toLowerCase() && (mine.enchant ?? 0) >= (g.enchant ?? 0);
    return { ...g, mine, ok };
  });

  const formProps: ProgressFormProps = {
    playerId: player.id,
    initial: {
      level: progress.level,
      itemLevel: progress.itemLevel,
      combatPower: progress.combatPower,
      ascensionStep: progress.ascensionStep,
      nightmareLayer: progress.nightmare.layer ?? 0,
      buildId: player.progress?.buildId ?? null,
      gear: progress.gear,
      daevanion: progress.daevanion,
      transcendence: progress.transcendence,
      skillLevels: progress.skillLevels,
      stigmas: progress.stigmas,
      notes: player.progress?.notes ?? "",
    },
    builds: builds.map((b) => ({ id: b.id, title: b.title })),
    skills: cls.skills.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      type: s.type,
      target: buildData?.skills.find((x) => x.skillId === s.id)?.targetLevel ?? null,
    })),
    stigmas: cls.stigmas.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      type: s.type,
      target: buildData?.stigmas.find((x) => x.stigmaId === s.id)?.targetLevel ?? null,
    })),
    gearSlots: GEAR_SLOTS.map((slot) => ({
      slot,
      label: GEAR_SLOT_LABELS[slot],
      target: buildData?.gear.find((g) => g.slot === slot)?.name ?? null,
      options: ITEMS.filter((i) => i.category === slotCategory(slot, classId))
        .sort((a, b) => (b.itemLevel ?? 0) - (a.itemLevel ?? 0))
        .map((i) => ({ name: i.name, itemLevel: i.itemLevel })),
    })),
    transcendence: TRANSCENDENCE.map((t) => ({ slug: t.slug, name: t.name, stages: t.stages })),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 @2xl/main:flex-row @2xl/main:items-center @2xl/main:justify-between">
        <div className="flex items-center gap-4">
          <ClassIcon classId={classId} size={64} />
          <div>
            <h1 className="font-display text-3xl font-bold">{player.name}</h1>
            <p className="text-muted-foreground">
              {info.fr} · {player.faction === "ELYOS" ? "Élyséen" : "Asmodien"}
              {player.server && ` · ${player.server}`}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <HeaderStat label="Niveau" value={String(progress.level)} />
          <HeaderStat label="Item level" value={formatNumber(progress.itemLevel)} />
          <HeaderStat label="Puissance" value={formatNumber(progress.combatPower)} />
        </div>
      </div>

      {median > 0 && progress.level >= 45 && (
        <div className="space-y-1">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>Puissance vs médiane des meilleurs {info.fr.toLowerCase()}s du serveur global</span>
            <span>
              {formatNumber(progress.combatPower)} / {formatNumber(median)}
            </span>
          </div>
          <Progress value={Math.min(100, (progress.combatPower / median) * 100)} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 @6xl/main:grid-cols-5">
        <Card className="@6xl/main:col-span-3">
          <CardHeader>
            <CardTitle>Que faire maintenant ?</CardTitle>
            <CardDescription>Ordonné par impact sur ta progression. Mets ton état des lieux à jour pour affiner.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecommendationList items={recommendations} limit={14} />
          </CardContent>
        </Card>

        <div className="space-y-6 @6xl/main:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="size-4" /> Build suivi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {build ? (
                <>
                  <Link href={`/builds/${build.slug}`} className="text-primary font-semibold hover:underline">
                    {build.title}
                  </Link>
                  {gearCompare && gearCompare.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {gearCompare.map((g) => (
                        <span key={g.slot} title={`${GEAR_SLOT_LABELS[g.slot]} : ${g.ok ? "OK" : `objectif ${g.name}${g.enchant ? ` +${g.enchant}` : ""}`}`}>
                          <ItemIcon name={g.name} slug={g.itemSlug} size={34} enchant={g.enchant} />
                          <span className={`mx-auto mt-0.5 block h-1 w-6 rounded ${g.ok ? "bg-success" : "bg-muted"}`} />
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">Aucun build suivi : les recommandations restent génériques.</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/builds?classe=${classId}`}>Choisir un build</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
              <CardDescription>Activités débloquées pour ton niveau et ton item level.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {relevant.length === 0 && <p className="text-muted-foreground text-sm">Rien de récurrent avant le niveau 10.</p>}
              {relevant.map((a) => (
                <div key={a.key} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <GameIcon src={a.icon} alt="" size={24} />
                    <span className="truncate">{a.label}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {a.reset === "daily" ? "jour" : "sem."}
                    </Badge>
                  </span>
                  <ActivityCounter playerId={player.id} activityKey={a.key} count={counts[a.key] ?? 0} target={a.target} max={a.bank ?? a.target * 4} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Évolution</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart data={snapshots.map((s) => ({ day: s.day, itemLevel: s.itemLevel, combatPower: s.combatPower }))} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>État des lieux</CardTitle>
          <CardDescription>Renseigne ce que tu as en jeu : le site en déduit tes prochaines étapes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressForm {...formProps} />
        </CardContent>
      </Card>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card/70 min-w-24 rounded-lg border px-3 py-2">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-[11px]">{label}</div>
    </div>
  );
}
