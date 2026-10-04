import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { ACTIVITIES, ACTIVITY_BY_KEY } from "@/data/activities";
import { buildDataSchema, buildInputSchema, CLASS_IDS, type BuildData, type BuildInput, type ClassIdT } from "@/lib/build-schema";
import { getClass, getItem, getSkill, getSpec } from "@/lib/game-data";
import { periodKey, todayIso } from "@/lib/periods";
import { getRecommendations, getTeamRecommendations, normalizeProgress, type ProgressState } from "@/lib/recommendations";
import { slugify } from "@/lib/utils";

// ------------------------------------------------------------------ joueurs

export async function listPlayers() {
  return prisma.player.findMany({ include: { progress: { include: { build: true } } }, orderBy: { createdAt: "asc" } });
}

export async function getPlayer(idOrName: string) {
  return prisma.player.findFirst({
    where: { OR: [{ id: idOrName }, { name: { equals: idOrName, mode: "insensitive" } }] },
    include: { progress: { include: { build: true } } },
  });
}

export async function createPlayer(input: { name: string; classId: ClassIdT; faction?: "ELYOS" | "ASMODIAN"; server?: string; color?: string }) {
  return prisma.player.create({
    data: { ...input, progress: { create: {} } },
    include: { progress: true },
  });
}

export async function updatePlayer(id: string, data: Partial<{ name: string; classId: ClassIdT; faction: "ELYOS" | "ASMODIAN"; server: string | null; color: string }>) {
  return prisma.player.update({ where: { id }, data });
}

export async function deletePlayer(id: string) {
  return prisma.player.delete({ where: { id } });
}

// ------------------------------------------------------------------ progression

export type ProgressPatch = Partial<
  Pick<ProgressState, "level" | "itemLevel" | "combatPower" | "ascensionStep" | "daevanion" | "transcendence" | "nightmare" | "gear" | "skillLevels" | "stigmas" | "clears">
> & { buildId?: string | null; notes?: string | null };

const JSON_FIELDS = ["daevanion", "transcendence", "nightmare", "gear", "skillLevels", "stigmas", "clears"] as const;

export async function updateProgress(playerId: string, patch: ProgressPatch, opts: { merge?: boolean } = { merge: true }) {
  const current = await prisma.playerProgress.upsert({ where: { playerId }, create: { playerId }, update: {} });
  const data: Prisma.PlayerProgressUpdateInput = {};
  for (const k of ["level", "itemLevel", "combatPower", "ascensionStep"] as const) {
    if (patch[k] != null) data[k] = Math.max(0, Math.round(Number(patch[k])));
  }
  if (patch.level != null) data.level = Math.min(60, Math.max(1, Math.round(patch.level)));
  for (const k of JSON_FIELDS) {
    if (patch[k] === undefined) continue;
    const base = opts.merge ? ((current[k] as Record<string, unknown>) ?? {}) : {};
    const merged = { ...base, ...(patch[k] as Record<string, unknown>) };
    // une valeur null supprime la clé
    for (const [key, v] of Object.entries(merged)) if (v === null) delete merged[key];
    data[k] = merged as Prisma.InputJsonValue;
  }
  if (patch.buildId !== undefined) data.build = patch.buildId ? { connect: { id: patch.buildId } } : { disconnect: true };
  if (patch.notes !== undefined) data.notes = patch.notes;

  const updated = await prisma.playerProgress.update({ where: { playerId }, data, include: { build: true } });
  await prisma.progressSnapshot.upsert({
    where: { playerId_day: { playerId, day: todayIso() } },
    create: { playerId, day: todayIso(), level: updated.level, itemLevel: updated.itemLevel, combatPower: updated.combatPower },
    update: { level: updated.level, itemLevel: updated.itemLevel, combatPower: updated.combatPower },
  });
  return updated;
}

export async function getSnapshots(playerId: string) {
  return prisma.progressSnapshot.findMany({ where: { playerId }, orderBy: { day: "asc" }, take: 120 });
}

// ------------------------------------------------------------------ activités

export async function getActivityCounts(playerIds: string[]) {
  const keys = [periodKey("daily"), periodKey("weekly")];
  const logs = await prisma.activityLog.findMany({ where: { playerId: { in: playerIds }, periodKey: { in: keys } } });
  const out: Record<string, Record<string, number>> = Object.fromEntries(playerIds.map((id) => [id, {}]));
  for (const l of logs) {
    const a = ACTIVITY_BY_KEY[l.activityKey];
    if (!a || l.periodKey !== periodKey(a.reset)) continue;
    out[l.playerId][l.activityKey] = l.count;
  }
  return out;
}

export async function setActivityCount(playerId: string, activityKey: string, count: number) {
  const a = ACTIVITY_BY_KEY[activityKey];
  if (!a) throw new Error(`Activité inconnue : ${activityKey}. Clés valides : ${ACTIVITIES.map((x) => x.key).join(", ")}`);
  const key = periodKey(a.reset);
  const value = Math.max(0, Math.min(count, a.bank ?? a.target * 4));
  return prisma.activityLog.upsert({
    where: { playerId_activityKey_periodKey: { playerId, activityKey, periodKey: key } },
    create: { playerId, activityKey, periodKey: key, count: value },
    update: { count: value },
  });
}

export async function incrementActivity(playerId: string, activityKey: string, delta = 1) {
  const counts = await getActivityCounts([playerId]);
  return setActivityCount(playerId, activityKey, (counts[playerId][activityKey] ?? 0) + delta);
}

// ------------------------------------------------------------------ recommandations

export async function getPlayerRecommendations(playerId: string) {
  const player = await getPlayer(playerId);
  if (!player) throw new Error("Joueur introuvable");
  const counts = (await getActivityCounts([player.id]))[player.id];
  const progress = normalizeProgress(player.progress as never);
  const build = player.progress?.build ? (player.progress.build.data as BuildData) : null;
  return { player, progress, counts, recommendations: getRecommendations(progress, { build, counts }) };
}

export async function getTeamOverview() {
  const players = await listPlayers();
  const counts = await getActivityCounts(players.map((p) => p.id));
  const rows = players.map((p) => {
    const progress = normalizeProgress(p.progress as never);
    const build = p.progress?.build ? (p.progress.build.data as BuildData) : null;
    const recs = getRecommendations(progress, { build, counts: counts[p.id] });
    const relevant = ACTIVITIES.filter((a) => progress.level >= a.minLevel && (!a.minItemLevel || progress.itemLevel >= a.minItemLevel));
    const daily = relevant.filter((a) => a.reset === "daily");
    const weekly = relevant.filter((a) => a.reset === "weekly");
    const ratio = (list: typeof relevant) =>
      list.length ? list.reduce((s, a) => s + Math.min(1, (counts[p.id][a.key] ?? 0) / a.target), 0) / list.length : null;
    return { player: p, progress, counts: counts[p.id], recommendations: recs, dailyRatio: ratio(daily), weeklyRatio: ratio(weekly) };
  });
  const team = getTeamRecommendations(rows.map((r) => ({ name: r.player.name, progress: r.progress })));
  return { rows, team };
}

// ------------------------------------------------------------------ builds

export type BuildValidation = { errors: string[]; warnings: string[] };

/** Vérifie que chaque ID référencé existe dans les données du client global pour cette classe. */
export function validateBuildData(classId: ClassIdT, data: BuildData): BuildValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cls = getClass(classId);
  const skillIds = new Set(cls.skills.map((s) => s.id));
  const stigmaIds = new Set(cls.stigmas.map((s) => s.id));

  for (const s of data.skills) {
    const sk = getSkill(s.skillId);
    if (!skillIds.has(s.skillId)) {
      errors.push(`Compétence ${s.skillId} : n'est pas un actif/passif de ${cls.name}${sk ? ` (c'est ${sk.name}, ${sk.classId}/${sk.type})` : ""}`);
      continue;
    }
    if (s.specializations.length && sk?.type === "passive") errors.push(`${sk.name} est un passif : pas de spécialisations`);
    for (const specId of s.specializations) {
      const spec = getSpec(specId);
      if (!spec || spec.skillId !== s.skillId) errors.push(`Spécialisation ${specId} : n'appartient pas à ${sk?.name}`);
    }
  }
  const slots = new Set<number>();
  for (const st of data.stigmas) {
    if (!stigmaIds.has(st.stigmaId)) errors.push(`Stigma ${st.stigmaId} : n'est pas un stigma de ${cls.name}`);
    if (slots.has(st.slot)) errors.push(`Emplacement de stigma ${st.slot} utilisé deux fois`);
    slots.add(st.slot);
    for (const alt of st.alternatives) if (!stigmaIds.has(alt)) errors.push(`Stigma alternatif ${alt} inconnu pour ${cls.name}`);
  }
  for (const b of data.daevanion.boards)
    for (const id of b.skillNodes) if (!skillIds.has(id)) errors.push(`Daevanion ${b.board} : compétence ${id} inconnue pour ${cls.name}`);
  for (const step of data.rotation.flatMap((r) => r.steps))
    if (typeof step === "number" && !skillIds.has(step) && !stigmaIds.has(step)) errors.push(`Rotation : compétence ${step} inconnue pour ${cls.name}`);
  for (const sw of data.pvpSwaps)
    if (!stigmaIds.has(sw.from) && !skillIds.has(sw.from)) errors.push(`Swap PvP : ${sw.from} inconnu`);
  for (const g of data.gear)
    if (!getItem(g.itemSlug ?? g.name)) warnings.push(`Objet « ${g.name} » absent du catalogue local (pas d'icône) — ajoutez son slug à scripts/extra-items.txt`);
  for (const a of data.arcana) if (!getItem(a.itemSlug ?? a.name)) warnings.push(`Arcane « ${a.name} » absente du catalogue local`);

  const pointsAt45 = cls.pointsTable.at(-1)?.skillPoints ?? 203;
  const cost = (lvl: number) => {
    let c = 0;
    for (let l = 2; l <= lvl; l++) c += l <= 4 ? 1 : l <= 7 ? 2 : 4;
    return c;
  };
  const spent = data.skills.reduce((s, x) => s + cost(x.targetLevel), 0);
  if (spent > pointsAt45) warnings.push(`Le build demande ${spent} points de compétence, il n'y en a que ${pointsAt45} au niveau 45`);
  return { errors, warnings };
}

export function skillPointCost(data: BuildData) {
  let total = 0;
  for (const s of data.skills) for (let l = 2; l <= s.targetLevel; l++) total += l <= 4 ? 1 : l <= 7 ? 2 : 4;
  return total;
}

export async function listBuilds(filter: { classId?: ClassIdT; mode?: "PVE" | "PVP" | "HYBRID" } = {}) {
  return prisma.build.findMany({
    where: { classId: filter.classId, mode: filter.mode },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getBuild(idOrSlug: string) {
  return prisma.build.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, include: { followers: { include: { player: true } } } });
}

export async function createBuild(raw: unknown) {
  const input: BuildInput = buildInputSchema.parse(raw);
  const v = validateBuildData(input.classId, input.data);
  if (v.errors.length) throw new BuildValidationError(v);
  let slug = slugify(`${input.classId}-${input.title}`);
  if (await prisma.build.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const build = await prisma.build.create({ data: { ...input, slug, data: input.data as Prisma.InputJsonValue } });
  return { build, warnings: v.warnings };
}

export async function updateBuild(idOrSlug: string, raw: unknown) {
  const existing = await getBuild(idOrSlug);
  if (!existing) throw new Error(`Build introuvable : ${idOrSlug}`);
  const patch = buildInputSchema.partial().parse(raw);
  const classId = patch.classId ?? (existing.classId as ClassIdT);
  const data = patch.data ? buildDataSchema.parse(patch.data) : (existing.data as BuildData);
  const v = validateBuildData(classId, data);
  if (v.errors.length) throw new BuildValidationError(v);
  const build = await prisma.build.update({
    where: { id: existing.id },
    data: { ...patch, classId, data: data as Prisma.InputJsonValue },
  });
  return { build, warnings: v.warnings };
}

export async function deleteBuild(idOrSlug: string) {
  const existing = await getBuild(idOrSlug);
  if (!existing) throw new Error(`Build introuvable : ${idOrSlug}`);
  return prisma.build.delete({ where: { id: existing.id } });
}

export class BuildValidationError extends Error {
  constructor(public validation: BuildValidation) {
    super("Build invalide :\n- " + validation.errors.join("\n- "));
  }
}

export const isClassId = (v: unknown): v is ClassIdT => typeof v === "string" && (CLASS_IDS as readonly string[]).includes(v);
