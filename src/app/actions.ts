"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { GEAR_SLOTS, type ClassIdT, type GearSlot } from "@/lib/build-schema";
import { createSessionToken, PLAYER_COOKIE, safeEqual, SESSION_COOKIE, SESSION_MAX_AGE, verifySessionToken } from "@/lib/session";
import { createPlayer, deletePlayer, isClassId, setActivityCount, updatePlayer, updateProgress } from "@/lib/services";

async function requireSession() {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(SESSION_COOKIE)?.value))) redirect("/login");
}

export async function login(_: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.TEAM_PASSWORD;
  if (!expected) return { error: "TEAM_PASSWORD n'est pas configuré sur le serveur." };
  if (!safeEqual(password, expected)) return { error: "Mot de passe incorrect." };
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PLAYER_COOKIE);
  redirect("/login");
}

export async function selectPlayer(playerId: string) {
  await requireSession();
  const store = await cookies();
  store.set(PLAYER_COOKIE, playerId, { httpOnly: true, sameSite: "lax", maxAge: SESSION_MAX_AGE, path: "/" });
  revalidatePath("/", "layout");
}

export async function addPlayer(_: unknown, formData: FormData) {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const classId = String(formData.get("classId") ?? "");
  const faction = formData.get("faction") === "ASMODIAN" ? "ASMODIAN" : "ELYOS";
  if (name.length < 2) return { error: "Nom trop court." };
  if (!isClassId(classId)) return { error: "Classe invalide." };
  try {
    const p = await createPlayer({ name, classId, faction, server: String(formData.get("server") ?? "") || undefined });
    revalidatePath("/", "layout");
    return { ok: true, id: p.id };
  } catch {
    return { error: "Ce nom existe déjà." };
  }
}

export async function editPlayer(playerId: string, data: { name?: string; classId?: ClassIdT; faction?: "ELYOS" | "ASMODIAN"; server?: string | null }) {
  await requireSession();
  await updatePlayer(playerId, data);
  revalidatePath("/", "layout");
}

export async function removePlayer(playerId: string) {
  await requireSession();
  await deletePlayer(playerId);
  revalidatePath("/", "layout");
}

const int = (v: FormDataEntryValue | null) => (v == null || v === "" ? undefined : Number(v));

export async function saveProgress(playerId: string, _: unknown, formData: FormData) {
  await requireSession();
  const gear: Partial<Record<GearSlot, { name?: string; itemLevel?: number; enchant?: number } | null>> = {};
  for (const slot of GEAR_SLOTS) {
    const name = String(formData.get(`gear.${slot}.name`) ?? "").trim();
    const itemLevel = int(formData.get(`gear.${slot}.itemLevel`));
    const enchant = int(formData.get(`gear.${slot}.enchant`));
    gear[slot] = name || itemLevel ? { name: name || undefined, itemLevel, enchant } : null;
  }
  const daevanion: Record<string, number | null> = {};
  for (const b of ["nezekan", "zikel", "vaizel", "triniel", "azphel"]) daevanion[b] = int(formData.get(`daevanion.${b}`)) ?? null;
  const transcendence: Record<string, number | null> = {};
  for (const [k, v] of formData.entries()) if (k.startsWith("transcendence.")) transcendence[k.slice(14)] = int(v) || null;
  const skillLevels: Record<string, number | null> = {};
  const stigmas: Record<string, number | null> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("skill.")) skillLevels[k.slice(6)] = int(v) ?? null;
    if (k.startsWith("stigma.")) stigmas[k.slice(7)] = int(v) || null;
  }
  const buildId = String(formData.get("buildId") ?? "");
  await updateProgress(playerId, {
    level: int(formData.get("level")),
    itemLevel: int(formData.get("itemLevel")),
    combatPower: int(formData.get("combatPower")),
    ascensionStep: int(formData.get("ascensionStep")),
    nightmare: { layer: int(formData.get("nightmare.layer")) },
    gear: gear as never,
    daevanion: daevanion as never,
    transcendence: transcendence as never,
    skillLevels: skillLevels as never,
    stigmas: stigmas as never,
    buildId: buildId === "none" ? null : buildId || undefined,
    notes: String(formData.get("notes") ?? "") || null,
  });
  revalidatePath("/", "layout");
  return { ok: true, savedAt: Date.now() };
}

export async function setCount(playerId: string, activityKey: string, count: number) {
  await requireSession();
  await setActivityCount(playerId, activityKey, count);
  revalidatePath("/", "layout");
}

export async function followBuild(playerId: string, buildId: string | null) {
  await requireSession();
  await updateProgress(playerId, { buildId });
  revalidatePath("/", "layout");
}
