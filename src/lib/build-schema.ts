import { z } from "zod";

export const CLASS_IDS = ["gladiator", "templar", "assassin", "ranger", "sorcerer", "spiritmaster", "cleric", "chanter"] as const;
export type ClassIdT = (typeof CLASS_IDS)[number];

export const GEAR_SLOTS = [
  "MainHand",
  "OffHand",
  "Helmet",
  "Shoulders",
  "Chest",
  "Legs",
  "Gloves",
  "Boots",
  "Cape",
  "Necklace",
  "Earring1",
  "Earring2",
  "Ring1",
  "Ring2",
  "Bracelet1",
  "Bracelet2",
  "Belt",
  "Amulet",
  "Rune1",
  "Rune2",
] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

export const GEAR_SLOT_LABELS: Record<GearSlot, string> = {
  MainHand: "Arme",
  OffHand: "Garde (main gauche)",
  Helmet: "Casque",
  Shoulders: "Épaulières",
  Chest: "Plastron",
  Legs: "Jambières",
  Gloves: "Gants",
  Boots: "Bottes",
  Cape: "Cape",
  Necklace: "Collier",
  Earring1: "Boucle d'oreille 1",
  Earring2: "Boucle d'oreille 2",
  Ring1: "Anneau 1",
  Ring2: "Anneau 2",
  Bracelet1: "Bracelet 1",
  Bracelet2: "Bracelet 2",
  Belt: "Ceinture",
  Amulet: "Amulette",
  Rune1: "Rune 1",
  Rune2: "Rune 2",
};

export const DAEVANION_BOARDS = ["Nezekan", "Zikel", "Vaizel", "Triniel", "Azphel"] as const;

const skillEntry = z.object({
  skillId: z.number().int().describe("ID d'une compétence active ou passive de la classe (voir get_class_data)"),
  targetLevel: z.number().int().min(1).max(10).describe("Niveau visé avec les points de compétence (1-10)"),
  priority: z.number().int().min(1).describe("Ordre d'investissement des points : 1 = en premier"),
  specializations: z
    .array(z.number().int())
    .max(3)
    .default([])
    .describe("IDs des spécialisations choisies (3 max), dans l'ordre d'activation"),
  note: z.string().optional(),
});

const stigmaEntry = z.object({
  slot: z.number().int().min(1).max(4).describe("Emplacement : 1 (niv. 22), 2 (27), 3 (32), 4 (37)"),
  stigmaId: z.number().int().describe("ID d'un stigma de la classe"),
  targetLevel: z.number().int().min(1).max(20),
  note: z.string().optional(),
  alternatives: z.array(z.number().int()).default([]).describe("Stigmas de remplacement selon le contenu"),
});

const gearEntry = z.object({
  slot: z.enum(GEAR_SLOTS),
  name: z.string().describe("Nom exact de l'objet (voir search_items)"),
  itemSlug: z.string().optional().describe("Slug de l'objet dans le catalogue, pour l'icône"),
  enchant: z.number().int().min(0).max(15).optional().describe("Enchantement visé"),
  source: z.string().optional().describe("Où l'obtenir (donjon, craft, raid…)"),
  note: z.string().optional(),
  alternatives: z.array(z.string()).default([]).describe("Noms d'objets de transition / alternatives"),
});

export const buildDataSchema = z.object({
  overview: z.object({
    playstyle: z.string().describe("Comment se joue le build, en quelques phrases"),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    difficulty: z.number().int().min(1).max(5).default(3),
    content: z.array(z.string()).default([]).describe("Contenus visés : Transcendance, Raid, Abysses, Arène…"),
  }),
  skills: z.array(skillEntry).describe("Actifs ET passifs à monter, avec spécialisations"),
  stigmas: z.array(stigmaEntry).max(4),
  daevanion: z.object({
    boards: z
      .array(
        z.object({
          board: z.enum(DAEVANION_BOARDS),
          focus: z.string().describe("Ce qu'on prend en priorité sur ce plateau"),
          skillNodes: z.array(z.number().int()).default([]).describe("IDs des compétences dont on prend les nœuds ronds"),
        }),
      )
      .default([]),
    statPriority: z.array(z.string()).default([]),
    notes: z.string().optional(),
  }),
  gear: z.array(gearEntry).default([]),
  manastones: z.array(z.object({ stat: z.string(), priority: z.number().int().min(1), note: z.string().optional() })).default([]),
  theostone: z.object({ name: z.string(), note: z.string().optional() }).optional(),
  arcana: z
    .array(z.object({ slot: z.number().int().min(1).max(5), name: z.string(), itemSlug: z.string().optional(), note: z.string().optional() }))
    .default([]),
  stats: z
    .object({
      primary: z.array(z.string()).default([]).describe("Priorité des stats primaires (Might, Precision…)"),
      deity: z.array(z.string()).default([]).describe("Priorité des stats divines (Justice [Nezekan]…)"),
    })
    .default({ primary: [], deity: [] }),
  rotation: z
    .array(
      z.object({
        title: z.string().describe("Ex : Ouverture, Mono-cible, Multi-cibles, Burst"),
        steps: z.array(z.union([z.number().int(), z.string()])).describe("IDs de compétences/stigmas, ou texte libre"),
        note: z.string().optional(),
      }),
    )
    .default([]),
  pvpSwaps: z.array(z.object({ from: z.number().int(), to: z.number().int(), why: z.string() })).default([]),
  tips: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
});

export type BuildData = z.infer<typeof buildDataSchema>;

export const buildInputSchema = z.object({
  title: z.string().min(3),
  classId: z.enum(CLASS_IDS),
  mode: z.enum(["PVE", "PVP", "HYBRID"]).default("PVE"),
  role: z.string().optional(),
  summary: z.string().min(10),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  author: z.string().default("Claude"),
  patch: z.string().optional(),
  featured: z.boolean().default(false),
  data: buildDataSchema,
});

export type BuildInput = z.infer<typeof buildInputSchema>;
