import gladiator from "@/data/game/classes/gladiator.json";
import templar from "@/data/game/classes/templar.json";
import assassin from "@/data/game/classes/assassin.json";
import ranger from "@/data/game/classes/ranger.json";
import sorcerer from "@/data/game/classes/sorcerer.json";
import spiritmaster from "@/data/game/classes/spiritmaster.json";
import cleric from "@/data/game/classes/cleric.json";
import chanter from "@/data/game/classes/chanter.json";
import itemsJson from "@/data/game/items.json";
import dungeonsJson from "@/data/game/dungeons.json";
import metaJson from "@/data/game/meta.json";
import type { ClassIdT, GearSlot } from "@/lib/build-schema";

export type PickMeta = { id: number; name: string; pickRate: number; avgLevel: number } | null;

export type Skill = {
  id: number;
  slug: string;
  name: string;
  type: "active" | "passive" | "stigma";
  unlockLevel: number | null;
  cooldown: string | null;
  maxLevel: number | null;
  effect: string;
  icon: string | null;
  meta: PickMeta;
};

export type Specialization = {
  id: number;
  skillId: number;
  skillName: string;
  requiredSkillLevel: number;
  effect: string;
  icon: string | null;
};

export type GearPick = { slug?: string | null; name: string; icon: string | null; pickRate: number; avgEnchant: number };

export type ClassData = {
  id: ClassIdT;
  name: string;
  icon: string;
  skills: Skill[];
  stigmas: Skill[];
  specializations: Specialization[];
  meta: {
    topPlayersTracked?: number;
    medianCombatPower?: number;
    top10CombatPower?: number;
    avgItemLevel?: number;
    daevanion: {
      boards: { board: string; commonNodes: number; totalNodes: number }[];
      topSkillNodes: { skill: string; bonus: number; board: string; pickRate: number }[];
    };
    gear: Record<string, GearPick[]>;
    enchants: Record<string, { avg: number; most: number; mostShare: number }>;
    manastones: { stat: string; pickRate: number; avgValue: string }[];
    arcana: Record<string, { name: string; icon: string | null; pickRate: number }[]>;
    wings: { name: string; icon: string | null; pickRate: number }[];
    pets: { name: string; icon: string | null; pickRate: number }[];
    primaryStats: { stat: string; avg: number }[];
    deityStats: { stat: string; avg: number }[];
  };
  pointsTable: { level: number; skillPoints: number; stigmaPoints: number; stigmaSlots: number }[];
  source: string;
};

export type Item = {
  slug: string;
  name: string;
  group: string;
  category: string;
  grade: string;
  itemLevel: number | null;
  requiredLevel: number | null;
  stats: string | null;
  icon: string | null;
  source?: string | null;
};

export type Dungeon = {
  slug: string;
  name: string;
  type: string | null;
  partySize?: number;
  level?: number;
  region?: string | null;
  bosses: string[];
  image: string | null;
};

const CLASS_DATA = { gladiator, templar, assassin, ranger, sorcerer, spiritmaster, cleric, chanter } as unknown as Record<
  ClassIdT,
  ClassData
>;

export const ITEMS = itemsJson as Item[];
export const DUNGEONS = dungeonsJson as Dungeon[];
export const GAME_META = metaJson as { source: string; syncedAt: string };

/** Infos éditoriales sur les classes (rôle, arme, nom FR) */
export const CLASS_INFO: Record<ClassIdT, { fr: string; role: string; weapon: string; color: string; blurb: string }> = {
  gladiator: {
    fr: "Gladiateur",
    role: "Tank / DPS",
    weapon: "Espadon",
    color: "#f97316",
    blurb: "Combattant de première ligne à l'espadon, très résistant grâce à ses passifs et redoutable en multi-cibles.",
  },
  templar: {
    fr: "Templier",
    role: "Tank",
    weapon: "Épée + garde",
    color: "#eab308",
    blurb: "Le seul tank pur : tient l'aggro, protège le groupe et apporte le buff Executor.",
  },
  assassin: {
    fr: "Assassin",
    role: "DPS mêlée",
    weapon: "Dagues",
    color: "#a855f7",
    blurb: "Joue sur les cumuls d'Insignes et les coups critiques pour des explosions de dégâts.",
  },
  ranger: {
    fr: "Rôdeur",
    role: "DPS distance",
    weapon: "Arc",
    color: "#22c55e",
    blurb: "Combat à 20 m et maintient ses buffs Gale et Precision ; ralentit et immobilise pour amplifier ses dégâts.",
  },
  sorcerer: {
    fr: "Sorcier",
    role: "DPS magique",
    weapon: "Grimoire",
    color: "#ef4444",
    blurb: "Lanceur de sorts à burst (feu) et contrôle (eau). Toute la classe tourne autour de la gestion du mana.",
  },
  spiritmaster: {
    fr: "Spiritualiste",
    role: "DPS magique / invocateur",
    weapon: "Orbe",
    color: "#06b6d4",
    blurb: "Joue à deux avec son esprit, empile les dégâts sur la durée et les Quatre Éléments.",
  },
  cleric: {
    fr: "Clerc",
    role: "Soigneur",
    weapon: "Masse",
    color: "#f8fafc",
    blurb: "Le seul soigneur pur, avec un vrai apport offensif via Chain of Torment.",
  },
  chanter: {
    fr: "Aède",
    role: "Support / DPS",
    weapon: "Bâton",
    color: "#3b82f6",
    blurb: "Hybride au bâton : soins de groupe, buffs de vitesse et dégâts autour de Dark Crush.",
  },
};

export function getClass(id: ClassIdT): ClassData {
  return CLASS_DATA[id];
}

export function allClasses() {
  return (Object.keys(CLASS_DATA) as ClassIdT[]).map((id) => CLASS_DATA[id]);
}

/** Toutes les compétences (actifs, passifs, stigmas) indexées par ID */
const SKILL_INDEX = new Map<number, Skill & { classId: ClassIdT }>();
const SPEC_INDEX = new Map<number, Specialization & { classId: ClassIdT }>();
for (const c of Object.values(CLASS_DATA)) {
  for (const s of [...c.skills, ...c.stigmas]) SKILL_INDEX.set(s.id, { ...s, classId: c.id });
  for (const s of c.specializations) SPEC_INDEX.set(s.id, { ...s, classId: c.id });
}

export const getSkill = (id: number) => SKILL_INDEX.get(id);
export const getSpec = (id: number) => SPEC_INDEX.get(id);

const ITEM_BY_SLUG = new Map(ITEMS.map((i) => [i.slug, i]));
const ITEM_BY_NAME = new Map(ITEMS.map((i) => [i.name.toLowerCase(), i]));
export const getItem = (slugOrName?: string | null) =>
  slugOrName ? (ITEM_BY_SLUG.get(slugOrName) ?? ITEM_BY_NAME.get(slugOrName.toLowerCase())) : undefined;

export function searchItems(query: string, opts: { category?: string; group?: string; minItemLevel?: number; limit?: number } = {}) {
  const q = query.toLowerCase().trim();
  return ITEMS.filter(
    (i) =>
      (!q || i.name.toLowerCase().includes(q)) &&
      (!opts.category || i.category.toLowerCase() === opts.category.toLowerCase()) &&
      (!opts.group || i.group === opts.group) &&
      (!opts.minItemLevel || (i.itemLevel ?? 0) >= opts.minItemLevel),
  )
    .sort((a, b) => (b.itemLevel ?? 0) - (a.itemLevel ?? 0))
    .slice(0, opts.limit ?? 25);
}

const DUNGEON_BY_SLUG = new Map(DUNGEONS.map((d) => [d.slug, d]));
export const getDungeon = (slug: string) => DUNGEON_BY_SLUG.get(slug);

export const CLASS_WEAPON_CATEGORY: Record<ClassIdT, string> = {
  gladiator: "Greatsword",
  templar: "Longsword",
  assassin: "Dagger",
  ranger: "Bow",
  sorcerer: "Spellbook",
  spiritmaster: "Orb",
  cleric: "Mace",
  chanter: "Staff",
};

/** Catégorie du catalogue correspondant à chaque emplacement d'équipement */
export function slotCategory(slot: GearSlot, classId: ClassIdT) {
  const map: Record<GearSlot, string> = {
    MainHand: CLASS_WEAPON_CATEGORY[classId],
    OffHand: "Guard",
    Helmet: "Helm",
    Shoulders: "Pauldron",
    Chest: "Top",
    Legs: "Leg",
    Gloves: "Glove",
    Boots: "Shoe",
    Cape: "Cloak",
    Necklace: "Necklace",
    Earring1: "Earring",
    Earring2: "Earring",
    Ring1: "Ring",
    Ring2: "Ring",
    Bracelet1: "Bracelet",
    Bracelet2: "Bracelet",
    Belt: "Belt",
    Amulet: "Amulet",
    Rune1: "Rune",
    Rune2: "Rune",
  };
  return map[slot];
}

/** Couleur de rareté du client */
export const GRADE_COLORS: Record<string, string> = {
  Common: "#d4d4d8",
  Rare: "#4ade80",
  Epic: "#60a5fa",
  Unique: "#FFD02B",
  Legendary: "#f97316",
  Special: "#e879f9",
};
