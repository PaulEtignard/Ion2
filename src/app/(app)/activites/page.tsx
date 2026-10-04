import { ActivityCounter } from "@/components/activity-counter";
import { GameIcon } from "@/components/game/game-icon";
import { ClassIcon } from "@/components/game/icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ACTIVITIES, CONQUEST_TIERS, EXPEDITION_GEAR, NIGHTMARE_LAYERS, TRANSCENDENCE, type Activity } from "@/data/activities";
import type { ClassIdT } from "@/lib/build-schema";
import { DUNGEONS } from "@/lib/game-data";
import { RESET_INFO } from "@/lib/periods";
import { getActivityCounts, listPlayers } from "@/lib/services";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Activités" };

export default async function ActivitiesPage() {
  const players = await listPlayers();
  const counts = await getActivityCounts(players.map((p) => p.id));

  const lockReason = (a: Activity, level: number, il: number) =>
    level < a.minLevel ? `Niveau ${a.minLevel} requis` : a.minItemLevel && il < a.minItemLevel ? `Item level ${formatNumber(a.minItemLevel)} requis` : undefined;

  const table = (reset: "daily" | "weekly") => (
    <Card>
      <CardHeader>
        <CardTitle>{reset === "daily" ? "Quotidien" : "Hebdomadaire (reset le mercredi)"}</CardTitle>
        <CardDescription>
          Reset à {RESET_INFO.hour} h ({RESET_INFO.tz}).{" "}
          {reset === "daily" ? "Les charges s'accumulent jusqu'au plafond indiqué : au-delà, elles sont perdues." : "Plafonds remis à zéro chaque mercredi."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activité</TableHead>
              {players.map((p) => (
                <TableHead key={p.id} className="text-center">
                  <span className="inline-flex flex-col items-center gap-1">
                    <ClassIcon classId={p.classId as ClassIdT} size={22} />
                    <span className="text-xs">{p.name}</span>
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ACTIVITIES.filter((a) => a.reset === reset).map((a) => (
              <TableRow key={a.key}>
                <TableCell className="max-w-md whitespace-normal">
                  <div className="flex gap-3">
                    <GameIcon src={a.icon} alt="" size={34} />
                    <div>
                      <div className="font-medium">{a.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {a.target} / {reset === "daily" ? "jour" : "semaine"}
                        {a.bank && ` · stock max ${a.bank}`}
                        {a.party && ` · groupe ${a.party}`}
                        {a.minItemLevel && ` · IL ${formatNumber(a.minItemLevel)}+`}
                        {` · niv. ${a.minLevel}+`}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">🎁 {a.rewards}</div>
                      {a.tip && <div className="mt-0.5 text-xs text-amber-300/90">💡 {a.tip}</div>}
                    </div>
                  </div>
                </TableCell>
                {players.map((p) => (
                  <TableCell key={p.id} className="text-center">
                    <ActivityCounter
                      playerId={p.id}
                      activityKey={a.key}
                      count={counts[p.id]?.[a.key] ?? 0}
                      target={a.target}
                      max={a.bank ?? a.target * 4}
                      locked={lockReason(a, p.progress?.level ?? 1, p.progress?.itemLevel ?? 0)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const party = DUNGEONS.filter((d) => d.type === "Party Dungeon" || d.type === "Raid");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Activités</h1>
        <p className="text-muted-foreground">Checklist de la team et référence endgame, tirées de la table des tickets du client global.</p>
      </div>

      {table("daily")}
      {table("weekly")}

      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Échelle d&apos;équipement</CardTitle>
            <CardDescription>Équipement Unique des Expéditions (mode Conquête) puis raid et craft.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXPEDITION_GEAR.map((t) => (
              <div key={t.itemLevel} className="flex items-center gap-3 rounded-lg border bg-black/15 p-2">
                <Badge className="w-16 justify-center">IL {t.itemLevel}</Badge>
                <div className="text-sm">
                  <div className="font-medium">{t.dungeons.join(" · ")}</div>
                  <div className="text-muted-foreground text-xs">Boss : {t.boss}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paliers d&apos;item level</CardTitle>
            <CardDescription>Conquête et Transcendance (saison 1 : 30/09 → 16/12/2026).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CONQUEST_TIERS.map((t) => (
                <Badge key={t.tier} variant="outline">
                  Conquête {t.tier} : {formatNumber(t.itemLevel)}
                  {t.level > 45 && ` (niv. ${t.level})`}
                </Badge>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transcendance</TableHead>
                  {[1, 2, 3, 4].map((s) => (
                    <TableHead key={s} className="text-center">
                      P{s}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRANSCENDENCE.map((d) => (
                  <TableRow key={d.slug}>
                    <TableCell>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-muted-foreground text-xs">{d.seasons}</div>
                    </TableCell>
                    {d.stages.map((s, i) => (
                      <TableCell key={i} className="text-center tabular-nums">
                        {formatNumber(s)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cauchemar — échelle de boss</CardTitle>
          <CardDescription>
            Chaque boss a 10 paliers. Le 2e étage s&apos;ouvre quand les boss d&apos;ouverture sont au palier 10 ; le boss final de couche ouvre la couche suivante.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 @2xl/main:grid-cols-2 @6xl/main:grid-cols-4">
          {NIGHTMARE_LAYERS.map((l) => (
            <div key={l.layer} className="rounded-lg border bg-black/15 p-3 text-sm">
              <div className="mb-1 font-semibold">
                Couche {l.layer} <span className="text-muted-foreground text-xs font-normal">· puissance {l.power}</span>
              </div>
              <div className="text-muted-foreground text-xs">Ouverture : {l.opening.join(", ")}</div>
              <div className="text-muted-foreground text-xs">2e étage : {l.second.join(", ")}</div>
              <div className="text-xs">
                Boss final : <span className="text-primary">{l.capstone}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Donjons de groupe et raids</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @6xl/main:grid-cols-4">
          {party.map((d) => (
            <div key={d.slug} className="overflow-hidden rounded-lg border bg-black/20">
              {d.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image} alt="" className="h-24 w-full object-cover opacity-80" loading="lazy" />
              )}
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{d.name}</span>
                  <Badge variant={d.type === "Raid" ? "default" : "secondary"}>{d.type === "Raid" ? "Raid 10" : "Groupe 5"}</Badge>
                </div>
                {d.bosses.length > 0 && <p className="text-muted-foreground mt-1 text-xs">{d.bosses.join(" · ")}</p>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
