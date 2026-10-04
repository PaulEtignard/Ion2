import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowRight, ChevronRight, Gem, Shield, ShieldAlert, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { FollowBuildButton } from "@/components/follow-build-button";
import { ClassIcon, ItemIcon, ItemName, SkillIcon, SpecIcon } from "@/components/game/icons";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STIGMA_SLOT_LEVELS, DAEVANION_BOARD_LEVELS } from "@/data/activities";
import { GEAR_SLOT_LABELS, GEAR_SLOTS, type BuildData, type ClassIdT } from "@/lib/build-schema";
import { isTeamMember } from "@/lib/auth";
import { getCurrentPlayerContext } from "@/lib/current";
import { CLASS_INFO, getClass, getSkill } from "@/lib/game-data";
import { getBuild, skillPointCost } from "@/lib/services";
import { cn } from "@/lib/utils";

const MODE_LABEL = { PVE: "PvE", PVP: "PvP", HYBRID: "Hybride" } as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = await getBuild((await params).slug);
  return { title: b?.title ?? "Build" };
}

export default async function BuildPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await isTeamMember();
  const [build, { current }] = await Promise.all([getBuild(slug), member ? getCurrentPlayerContext() : Promise.resolve({ current: null })]);
  if (!build) notFound();
  const data = build.data as BuildData;
  const classId = build.classId as ClassIdT;
  const cls = getClass(classId);
  const info = CLASS_INFO[classId];
  const skills = [...data.skills].sort((a, b) => a.priority - b.priority);
  const actives = skills.filter((s) => getSkill(s.skillId)?.type === "active");
  const passives = skills.filter((s) => getSkill(s.skillId)?.type === "passive");
  const spent = skillPointCost(data);
  const budget = cls.pointsTable.at(-1)?.skillPoints ?? 203;
  const stigmas = [...data.stigmas].sort((a, b) => a.slot - b.slot);
  const gearBySlot = new Map(data.gear.map((g) => [g.slot, g]));
  const isFollowing = current?.progress?.buildId === build.id;

  const sections = [
    ["apercu", "Aperçu"],
    ["competences", "Compétences"],
    ["stigmas", "Stigmas"],
    ["rotation", "Rotation"],
    ["daevanion", "Daevanion"],
    ["equipement", "Équipement"],
    ["conseils", "Conseils"],
  ] as const;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/builds">Builds</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/builds?classe=${classId}`}>{info.fr}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{build.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ------------------------------------------------------------ en-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <ClassIcon classId={classId} size={72} />
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold">{build.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              <Badge>{MODE_LABEL[build.mode]}</Badge>
              <Badge variant="secondary">{build.role ?? info.role}</Badge>
              <Badge variant="outline">{info.weapon}</Badge>
              {build.tags.map((t) => (
                <Badge key={t} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground max-w-3xl">{build.summary}</p>
            <p className="text-muted-foreground text-xs">
              Par {build.author} · mis à jour le {build.updatedAt.toLocaleDateString("fr-FR")}
              {build.patch && ` · version ${build.patch}`}
              {member && build.followers.length > 0 && ` · suivi par ${build.followers.map((f) => f.player.name).join(", ")}`}
            </p>
          </div>
        </div>
        {current && current.classId === classId && <FollowBuildButton playerId={current.id} buildId={build.id} following={isFollowing} />}
      </div>

      <nav className="bg-background/80 sticky top-14 z-20 -mx-1 flex gap-1 overflow-x-auto border-b px-1 py-2 backdrop-blur">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-1 text-sm whitespace-nowrap">
            {label}
          </a>
        ))}
      </nav>

      {/* ------------------------------------------------------------ aperçu */}
      <section id="apercu" className="grid scroll-mt-28 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Style de jeu</CardTitle>
            <CardDescription className="flex items-center gap-1">
              Difficulté
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("size-3.5", i < data.overview.difficulty ? "fill-primary text-primary" : "text-muted")} />
              ))}
              {data.overview.content.length > 0 && <span className="ml-2">· {data.overview.content.join(" · ")}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed">{data.overview.playstyle}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProsCons title="Points forts" items={data.overview.strengths} icon={<ThumbsUp className="size-4 text-emerald-400" />} />
              <ProsCons title="Points faibles" items={data.overview.weaknesses} icon={<ThumbsDown className="size-4 text-rose-400" />} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En un coup d&apos;œil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-xs uppercase">Compétences clés</p>
              <div className="flex flex-wrap gap-1.5">
                {actives.slice(0, 6).map((s) => (
                  <SkillIcon key={s.skillId} id={s.skillId} size={40} level={s.targetLevel} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs uppercase">Stigmas</p>
              <div className="flex flex-wrap gap-1.5">
                {stigmas.map((s) => (
                  <SkillIcon key={s.stigmaId} id={s.stigmaId} size={40} level={s.targetLevel} />
                ))}
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Points de compétence : </span>
              <span className={cn("font-semibold tabular-nums", spent > budget && "text-destructive")}>
                {spent} / {budget}
              </span>
            </div>
            {data.theostone && (
              <div className="text-sm">
                <span className="text-muted-foreground">Théostone : </span>
                <span className="font-medium">{data.theostone.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ------------------------------------------------------------ compétences */}
      <section id="competences" className="scroll-mt-28 space-y-4">
        <SectionTitle title="Compétences & spécialisations" subtitle="Ordre d'investissement des points, niveau visé et spécialisations à activer (emplacements aux niveaux 8, 12 et 20)." />
        <SkillTable title="Compétences actives" rows={actives} withSpecs />
        <SkillTable title="Passifs" rows={passives} />
      </section>

      {/* ------------------------------------------------------------ stigmas */}
      <section id="stigmas" className="scroll-mt-28 space-y-4">
        <SectionTitle title="Stigmas" subtitle="Un emplacement s'ouvre aux niveaux 22, 27, 32 et 37. Le niveau 5 débloque la première spécialisation du stigma." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((slot) => {
            const st = stigmas.find((s) => s.slot === slot);
            const sk = st && getSkill(st.stigmaId);
            return (
              <Card key={slot} className="gap-3">
                <CardHeader>
                  <CardDescription>
                    Emplacement {slot} · niveau {STIGMA_SLOT_LEVELS[slot - 1]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {st && sk ? (
                    <>
                      <div className="flex items-center gap-3">
                        <SkillIcon id={st.stigmaId} size={52} level={st.targetLevel} />
                        <div>
                          <div className="font-semibold">{sk.name}</div>
                          <div className="text-muted-foreground text-xs">
                            Niveau visé {st.targetLevel}
                            {sk.cooldown && ` · recharge ${sk.cooldown}`}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{sk.effect}</p>
                      {st.note && <p className="text-sm">{st.note}</p>}
                      {st.alternatives.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">Alternatives</span>
                          {st.alternatives.map((a) => (
                            <SkillIcon key={a} id={a} size={30} />
                          ))}
                        </div>
                      )}
                      {sk.meta && <p className="text-muted-foreground text-[11px]">Choisi par {sk.meta.pickRate}% des meilleurs {info.fr.toLowerCase()}s</p>}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">Libre</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {data.pvpSwaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4" /> Ajustements PvP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pvpSwaps.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3">
                  <SkillIcon id={s.from} size={34} />
                  <ArrowRight className="text-muted-foreground size-4" />
                  <SkillIcon id={s.to} size={34} />
                  <span className="text-sm">{s.why}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      {/* ------------------------------------------------------------ rotation */}
      {data.rotation.length > 0 && (
        <section id="rotation" className="scroll-mt-28 space-y-4">
          <SectionTitle title="Rotations" subtitle="Survole une icône pour voir le détail de la compétence." />
          <div className="grid gap-4 lg:grid-cols-2">
            {data.rotation.map((r, i) => (
              <Card key={i} className="gap-3">
                <CardHeader>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {r.steps.map((step, j) => (
                      <span key={j} className="flex items-center gap-1.5">
                        {j > 0 && <ChevronRight className="text-muted-foreground size-3.5" />}
                        {typeof step === "number" ? (
                          <SkillIcon id={step} size={38} />
                        ) : (
                          <span className="bg-muted rounded px-2 py-1 text-xs">{step}</span>
                        )}
                      </span>
                    ))}
                  </div>
                  {r.note && <p className="text-muted-foreground text-sm">{r.note}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ daevanion */}
      <section id="daevanion" className="scroll-mt-28 space-y-4">
        <SectionTitle title="Daevanion" subtitle="Les nœuds ronds ajoutent +1 niveau à une compétence (+4 max), au-delà du niveau 10." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.daevanion.boards.map((b) => (
            <Card key={b.board} className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">{b.board}</CardTitle>
                <CardDescription>
                  Niveau {DAEVANION_BOARD_LEVELS[b.board].level} · {DAEVANION_BOARD_LEVELS[b.board].points} points pour le compléter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{b.focus}</p>
                {b.skillNodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {b.skillNodes.map((id) => (
                      <SkillIcon key={id} id={id} size={32} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {(data.daevanion.statPriority.length > 0 || data.daevanion.notes) && (
          <Card>
            <CardContent className="space-y-2">
              {data.daevanion.statPriority.length > 0 && <PriorityLine label="Priorité des nœuds de stats" items={data.daevanion.statPriority} />}
              {data.daevanion.notes && <p className="text-muted-foreground text-sm">{data.daevanion.notes}</p>}
            </CardContent>
          </Card>
        )}
      </section>

      {/* ------------------------------------------------------------ équipement */}
      <section id="equipement" className="scroll-mt-28 space-y-4">
        <SectionTitle title="Équipement" subtitle="Pièce visée par emplacement, enchantement cible et où l'obtenir. Survole les icônes pour les stats." />
        <div className="grid gap-3 md:grid-cols-2">
          {GEAR_SLOTS.filter((s) => gearBySlot.has(s)).map((slot) => {
            const g = gearBySlot.get(slot)!;
            return (
              <div key={slot} className="bg-card/60 flex gap-3 rounded-xl border p-3">
                <ItemIcon name={g.name} slug={g.itemSlug} size={52} enchant={g.enchant} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-muted-foreground text-xs uppercase">{GEAR_SLOT_LABELS[slot]}</div>
                  <ItemName name={g.name} slug={g.itemSlug} />
                  {g.source && <p className="text-muted-foreground text-xs">Source : {g.source}</p>}
                  {g.note && <p className="text-sm">{g.note}</p>}
                  {g.alternatives.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-muted-foreground text-xs">Transition :</span>
                      {g.alternatives.map((a) => (
                        <ItemIcon key={a} name={a} size={26} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {data.manastones.length > 0 && (
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gem className="size-4 text-sky-400" /> Pierres de mana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1.5 text-sm">
                  {[...data.manastones]
                    .sort((a, b) => a.priority - b.priority)
                    .map((m) => (
                      <li key={m.stat} className="flex gap-2">
                        <span className="text-primary font-semibold tabular-nums">{m.priority}.</span>
                        <span>
                          {m.stat}
                          {m.note && <span className="text-muted-foreground"> — {m.note}</span>}
                        </span>
                      </li>
                    ))}
                </ol>
              </CardContent>
            </Card>
          )}
          {data.arcana.length > 0 && (
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">Arcanes</CardTitle>
                <CardDescription>Obtenues en Transcendance ; elles augmentent l&apos;item level total.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...data.arcana]
                  .sort((a, b) => a.slot - b.slot)
                  .map((a) => (
                    <div key={a.slot} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-4 text-xs">{a.slot}</span>
                      <ItemIcon name={a.name} slug={a.itemSlug} size={34} showName />
                      {a.note && <span className="text-muted-foreground text-xs">{a.note}</span>}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4" /> Stats & théostone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.theostone && (
                <p>
                  <span className="font-medium">{data.theostone.name}</span>
                  {data.theostone.note && <span className="text-muted-foreground"> — {data.theostone.note}</span>}
                </p>
              )}
              {data.stats.primary.length > 0 && <PriorityLine label="Stats primaires" items={data.stats.primary} />}
              {data.stats.deity.length > 0 && <PriorityLine label="Stats divines" items={data.stats.deity} />}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------ conseils */}
      <section id="conseils" className="scroll-mt-28 space-y-4">
        <SectionTitle title="Conseils" />
        <Card>
          <CardContent className="space-y-4">
            {data.tips.length > 0 && (
              <ul className="list-disc space-y-2 pl-5">
                {data.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
            {build.description && (
              <div className="prose prose-invert prose-sm max-w-none [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2">
                <ReactMarkdown>{build.description}</ReactMarkdown>
              </div>
            )}
            {data.sources.length > 0 && (
              <p className="text-muted-foreground text-xs">
                Sources :{" "}
                {data.sources.map((s, i) => (
                  <span key={s}>
                    {i > 0 && " · "}
                    {s.startsWith("http") ? (
                      <a href={s} target="_blank" rel="noreferrer" className="underline">
                        {new URL(s).hostname}
                      </a>
                    ) : (
                      s
                    )}
                  </span>
                ))}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
    </div>
  );
}

function ProsCons({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon} {title}
      </p>
      <ul className="text-muted-foreground space-y-1 text-sm">
        {items.map((s) => (
          <li key={s}>• {s}</li>
        ))}
      </ul>
    </div>
  );
}

function PriorityLine({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs uppercase">{label}</p>
      <div className="flex flex-wrap items-center gap-1">
        {items.map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="text-muted-foreground size-3" />}
            <Badge variant="secondary">{s}</Badge>
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillTable({ title, rows, withSpecs }: { title: string; rows: BuildData["skills"]; withSpecs?: boolean }) {
  if (!rows.length) return null;
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Compétence</TableHead>
              <TableHead className="w-20 text-center">Niveau</TableHead>
              {withSpecs && <TableHead>Spécialisations</TableHead>}
              <TableHead className="hidden lg:table-cell">Pourquoi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => {
              const sk = getSkill(s.skillId);
              return (
                <TableRow key={s.skillId}>
                  <TableCell className="text-primary font-semibold tabular-nums">{s.priority}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <SkillIcon id={s.skillId} size={40} />
                      <div>
                        <div className="font-medium">{sk?.name}</div>
                        <div className="text-muted-foreground text-xs">
                          Niv. {sk?.unlockLevel}
                          {sk?.cooldown && ` · ${sk.cooldown}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold tabular-nums">{s.targetLevel}</TableCell>
                  {withSpecs && (
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        {s.specializations.map((id) => (
                          <SpecIcon key={id} id={id} size={28} showText />
                        ))}
                        {!s.specializations.length && <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground hidden max-w-sm text-sm whitespace-normal lg:table-cell">{s.note}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
