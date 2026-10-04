import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassIcon, ItemIcon, SkillIcon, SpecIcon } from "@/components/game/icons";
import { GameIcon } from "@/components/game/game-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASS_INFO, getClass, type Skill } from "@/lib/game-data";
import { isClassId, listBuilds } from "@/lib/services";
import { formatNumber } from "@/lib/utils";

const SLOT_FR: Record<string, string> = {
  "Main hand": "Arme",
  "Off-hand": "Garde",
  Helmet: "Casque",
  Shoulders: "Épaulières",
  Chest: "Plastron",
  Legs: "Jambières",
  Gloves: "Gants",
  Boots: "Bottes",
  Cape: "Cape",
  Necklace: "Collier",
  Earring: "Boucles d'oreille",
  Ring: "Anneaux",
  Bracelet: "Bracelets",
  Belt: "Ceinture",
  Amulet: "Amulette",
  Rune: "Rune",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: isClassId(id) ? CLASS_INFO[id].fr : "Classe" };
}

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isClassId(id)) notFound();
  const c = getClass(id);
  const info = CLASS_INFO[id];
  const builds = await listBuilds({ classId: id });
  const actives = c.skills.filter((s) => s.type === "active");
  const passives = c.skills.filter((s) => s.type === "passive");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ClassIcon classId={id} size={80} />
        <div>
          <h1 className="font-display text-3xl font-bold">{info.fr}</h1>
          <p className="text-muted-foreground">
            {c.name} · {info.role} · {info.weapon}
          </p>
          <p className="mt-1 max-w-2xl text-sm">{info.blurb}</p>
        </div>
      </div>

      {builds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {builds.map((b) => (
            <Link key={b.id} href={`/builds/${b.slug}`}>
              <Badge variant="outline" className="hover:border-primary px-3 py-1 text-sm">
                {b.title}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Compétences</TabsTrigger>
          <TabsTrigger value="stigmas">Stigmas</TabsTrigger>
          <TabsTrigger value="specs">Spécialisations</TabsTrigger>
          <TabsTrigger value="meta">Méta des meilleurs joueurs</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <SkillGrid title={`Actives (${actives.length})`} skills={actives} />
          <SkillGrid title={`Passives (${passives.length})`} skills={passives} />
        </TabsContent>

        <TabsContent value="stigmas">
          <SkillGrid title={`Stigmas (${c.stigmas.length}) — 4 emplacements aux niveaux 22, 27, 32 et 37`} skills={c.stigmas} />
        </TabsContent>

        <TabsContent value="specs" className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2">
          {actives.map((s) => (
            <Card key={s.id} className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <SkillIcon id={s.id} size={32} /> {s.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.specializations
                  .filter((sp) => sp.skillId === s.id)
                  .map((sp) => (
                    <SpecIcon key={sp.id} id={sp.id} size={28} showText />
                  ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="meta" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-4">
            <MetaStat label="Meilleurs joueurs suivis" value={formatNumber(c.meta.topPlayersTracked)} />
            <MetaStat label="Puissance médiane" value={formatNumber(c.meta.medianCombatPower)} />
            <MetaStat label="Top 10 % dès" value={formatNumber(c.meta.top10CombatPower)} />
            <MetaStat label="Item level moyen" value={formatNumber(c.meta.avgItemLevel)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Équipement le plus porté</CardTitle>
              <CardDescription>Par emplacement, avec l&apos;enchantement moyen. Source : profils officiels des meilleurs joueurs du serveur global.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @6xl/main:grid-cols-3">
              {Object.entries(c.meta.gear).map(([slot, picks]) => (
                <div key={slot} className="rounded-lg border bg-black/15 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground uppercase">{SLOT_FR[slot] ?? slot}</span>
                    {c.meta.enchants[slot] && <span>moy. +{c.meta.enchants[slot].avg}</span>}
                  </div>
                  <div className="space-y-1.5">
                    {dedupe(picks).map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-sm">
                        <ItemIcon name={p.name} slug={p.slug ?? undefined} fallbackIcon={p.icon} size={30} enchant={Math.round(p.avgEnchant)} />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">{p.pickRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-3">
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">Pierres de mana</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {c.meta.manastones.map((m) => (
                  <div key={m.stat} className="flex justify-between">
                    <span>{m.stat}</span>
                    <span className="text-muted-foreground tabular-nums">moy. +{m.avgValue}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">Stats moyennes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <StatBars items={c.meta.primaryStats} />
                <StatBars items={c.meta.deityStats} />
              </CardContent>
            </Card>
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">Daevanion, ailes & familiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {c.meta.daevanion.topSkillNodes.map((n) => (
                  <div key={n.skill + n.board} className="flex justify-between">
                    <span>
                      {n.skill} +{n.bonus} <span className="text-muted-foreground">({n.board})</span>
                    </span>
                    <span className="text-muted-foreground tabular-nums">{n.pickRate}%</span>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  {[...c.meta.wings, ...c.meta.pets].slice(0, 8).map((w) => (
                    <GameIcon key={w.name} src={w.icon} alt={w.name} size={36} tooltip={{ title: w.name, subtitle: `${w.pickRate}% des meilleurs joueurs` }} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <p className="text-muted-foreground text-xs">
        Données : <a className="underline" href={c.source} target="_blank" rel="noreferrer">metabot.gg</a> (client global).
      </p>
    </div>
  );
}

function dedupe<T extends { name: string }>(list: T[]) {
  return [...new Map(list.map((x) => [x.name, x])).values()];
}

function SkillGrid({ title, skills }: { title: string; skills: Skill[] }) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 @2xl/main:grid-cols-2">
        {skills.map((s) => (
          <div key={s.id} className="flex gap-3 rounded-lg border bg-black/15 p-3">
            <SkillIcon id={s.id} size={44} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground text-xs">
                  niv. {s.unlockLevel}
                  {s.cooldown && ` · ${s.cooldown}`}
                </span>
                {s.meta && (
                  <Badge variant="outline" className="text-[10px]">
                    {s.meta.pickRate}% top
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{s.effect}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-1 py-4 text-center">
      <div className="text-primary text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </Card>
  );
}

function StatBars({ items }: { items: { stat: string; avg: number }[] }) {
  const max = Math.max(...items.map((i) => i.avg), 1);
  return (
    <div className="space-y-1">
      {items.map((i) => (
        <div key={i.stat} className="flex items-center gap-2">
          <span className="w-36 shrink-0 truncate text-xs">{i.stat}</span>
          <div className="bg-muted h-1.5 flex-1 rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: `${(i.avg / max) * 100}%` }} />
          </div>
          <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">{i.avg}</span>
        </div>
      ))}
    </div>
  );
}
