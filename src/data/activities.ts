/**
 * Activités récurrentes d'AION 2 (client global), d'après la table des tickets du client
 * (metabot.gg/en/aion-2/weekly-reset et guide endgame). Les resets hebdo ont lieu le mercredi.
 */
export type ResetKind = "daily" | "weekly";

export type Activity = {
  key: string;
  name: string; // nom du client (anglais)
  label: string; // libellé FR
  reset: ResetKind;
  /** nombre de passages à faire par période pour cocher l'activité */
  target: number;
  /** charges stockables (pour les recharges quotidiennes) */
  bank?: number;
  minLevel: number;
  minItemLevel?: number;
  party?: string;
  rewards: string;
  tip?: string;
  /** importance pour la progression (plus haut = plus important) */
  weight: number;
  icon?: string;
  dungeons?: string[];
};

export const ACTIVITIES: Activity[] = [
  // ----------------------------------------------------------------- quotidien
  {
    key: "transcendence",
    name: "Transcendence",
    label: "Transcendance (Deus Research Base / Shattered Arkanis)",
    reset: "daily",
    target: 2,
    bank: 4,
    minLevel: 45,
    minItemLevel: 1600,
    party: "2-5",
    rewards: "Arcanes (Commun → Unique), points de rang saisonnier",
    tip: "Les charges ne se stockent que jusqu'à 4 : c'est LA quotidienne à ne jamais sauter.",
    weight: 100,
    icon: "/game/items/icon_ticket_add_partychallenge_001.webp",
    dungeons: ["deus-research-base", "shattered-arkanis"],
  },
  {
    key: "conquest",
    name: "Expedition: Conquest",
    label: "Expédition – Conquête (mode Normal)",
    reset: "daily",
    target: 2,
    bank: 14,
    minLevel: 45,
    minItemLevel: 700,
    party: "1-5",
    rewards: "Équipement Unique IL 54 / 70 / 86, Gear Change Vouchers, Wrathful Ego (Fire Temple / Ferocious Horn Den)",
    tip: "Toujours ouvrir le cube d'Odyle à la fin, sinon le compteur hebdo baisse quand même. 35 kills de boss final max / semaine.",
    weight: 90,
    icon: "/game/items/icon_ticket_entrance_dungeon_001.webp",
    dungeons: ["krao-cave", "draupnir", "urugugu-canyon", "vakron-sky-island", "fire-temple", "ferocious-horn-den"],
  },
  {
    key: "nightmare",
    name: "Nightmare",
    label: "Cauchemar (échelle de boss)",
    reset: "daily",
    target: 2,
    bank: 14,
    minLevel: 45,
    party: "solo/groupe",
    rewards: "Phantasmal Fragments (boutique Cauchemar)",
    tip: "Une tentative n'est consommée qu'en cas de victoire : un échec est un entraînement gratuit.",
    weight: 70,
    icon: "/game/items/icon_ticket_entrance_bosschallenge_001.webp",
  },
  {
    key: "odyle",
    name: "Odyle Energy",
    label: "Énergie d'Odyle (ouvrir les cubes)",
    reset: "daily",
    target: 1,
    minLevel: 10,
    rewards: "Récompenses des cubes de donjon",
    tip: "+15 toutes les 3 h, plafond 560 (840 avec abonnement) : la dépenser avant d'être plein.",
    weight: 50,
    icon: "/game/items/icon_item_odenergy_a_001.webp",
  },
  {
    key: "duty",
    name: "Duty Missions",
    label: "Missions de devoir (Wanted) + Commandes",
    reset: "daily",
    target: 1,
    minLevel: 45,
    rewards: "50 000 Kinah liés + 1 000 Points Abyssaux par mission",
    tip: "Source régulière de Points Abyssaux pour le Potentiel.",
    weight: 45,
  },
  {
    key: "daily-dungeon",
    name: "Daily Dungeon",
    label: "Donjons quotidiens (Abandoned Balaur Fortress / Fafnium Laboratory)",
    reset: "daily",
    target: 1,
    bank: 7,
    minLevel: 30,
    rewards: "Matériaux et Kinah",
    weight: 35,
    icon: "/game/items/icon_ticket_entrance_dailydungeon_001.webp",
  },
  {
    key: "shugo-festival",
    name: "Shugo Festival",
    label: "Festival Shugo",
    reset: "daily",
    target: 4,
    bank: 28,
    minLevel: 10,
    rewards: "Clés de récompense du festival",
    weight: 20,
  },
  // ----------------------------------------------------------------- hebdomadaire
  {
    key: "raid-ludra",
    name: "[Sanctuary] Abyssal Forge: Ludra",
    label: "Raid – Abyssal Forge : Ludra",
    reset: "weekly",
    target: 1,
    minLevel: 45,
    party: "10",
    rewards: "Armes et garde IL 102 (Ludra's Blade of Extinction…), Ludra Gear Vouchers",
    tip: "4 tentatives / semaine, 1 kill du boss final. Le seul raid avec une table de butin connue.",
    weight: 85,
    icon: "/game/items/icon_ticket_entrance_raid_001.webp",
    dungeons: ["abyssal-forge-ludra"],
  },
  {
    key: "raid-muspel",
    name: "[Sanctuary] Chalice of Muspel",
    label: "Raid – Chalice of Muspel",
    reset: "weekly",
    target: 2,
    minLevel: 45,
    party: "10",
    rewards: "Récompenses de raid",
    tip: "4 tentatives, 2 kills du boss final par semaine.",
    weight: 60,
    icon: "/game/items/icon_ticket_entrance_raid_003.webp",
    dungeons: ["chalice-of-muspel"],
  },
  {
    key: "raid-corroded",
    name: "[Sanctuary] Corroded Decontamination Facility",
    label: "Raid – Corroded Decontamination Facility",
    reset: "weekly",
    target: 2,
    minLevel: 45,
    party: "10",
    rewards: "Récompenses de raid",
    tip: "4 tentatives, 2 kills du boss final par semaine.",
    weight: 60,
    icon: "/game/items/icon_ticket_entrance_raid_002.webp",
    dungeons: ["corroded-decontamination-facility"],
  },
  {
    key: "ascension-trial",
    name: "Ascension Trial",
    label: "Épreuve d'Ascension (Nightmare Altar…)",
    reset: "weekly",
    target: 3,
    minLevel: 45,
    rewards: "Enhance Stones, Amplify Stone Fragments (Unique), coffres",
    tip: "L'entrée est consommée en entrant : choisir la difficulté qu'on finit sans dépasser la limite de morts et viser le score.",
    weight: 75,
    icon: "/game/items/icon_ticket_entrance_awaken_001.webp",
    dungeons: ["nightmare-altar", "tyrants-hideout", "sanctum-of-loathing", "depository-of-fates", "forgotten-repository", "chamber-of-the-dead"],
  },
  {
    key: "subjugation",
    name: "Subjugation",
    label: "Subjugation (instances 4 joueurs)",
    reset: "weekly",
    target: 3,
    minLevel: 45,
    party: "1-4",
    rewards: "Récompenses PvE",
    weight: 40,
    icon: "/game/items/icon_item_currency_add_ticket_dungeon_001.webp",
    dungeons: ["subjugation-closed", "beritra-brigade-fortress", "orcuss-grave", "fafnite-forge"],
  },
  {
    key: "abyss",
    name: "Abyss (Reshanta)",
    label: "Abysses – 7 h par couche de Reshanta",
    reset: "weekly",
    target: 3,
    minLevel: 45,
    rewards: "Points Abyssaux (Potentiel), artefacts, sets Courage / Kaira",
    tip: "Cocher une fois par couche (Lower / Middle / Upper). Latesran Western Root demande IL 1 000.",
    weight: 55,
  },
  {
    key: "exploration",
    name: "Expedition: Exploration",
    label: "Expédition – Exploration (mode Facile)",
    reset: "weekly",
    target: 7,
    minLevel: 45,
    party: "1-5",
    rewards: "7 récompenses par donjon / semaine : matériaux, équipement de transition",
    tip: "Draupnir, Vakron Sky Island et Ferocious Horn Den donnent le même butin qu'en Conquête.",
    weight: 45,
    dungeons: ["draupnir", "vakron-sky-island", "ferocious-horn-den"],
  },
  {
    key: "unknown-fissure",
    name: "Daily Dungeon: Unknown Fissure",
    label: "Fissure inconnue",
    reset: "weekly",
    target: 14,
    minLevel: 30,
    rewards: "Matériaux",
    weight: 25,
    icon: "/game/items/icon_ticket_entrance_dailydungeon_001.webp",
  },
];

export const ACTIVITY_BY_KEY = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a]));

/** Paliers d'item level du client global */
export const CONQUEST_TIERS = [
  { tier: 1, level: 45, itemLevel: 700 },
  { tier: 2, level: 45, itemLevel: 1400 },
  { tier: 3, level: 45, itemLevel: 2100 },
  { tier: 4, level: 45, itemLevel: 2800 },
  { tier: 5, level: 45, itemLevel: 3000 },
  { tier: 6, level: 50, itemLevel: 3800 },
];

export const TRANSCENDENCE = [
  { slug: "deus-research-base", name: "Deus Research Base", stages: [1600, 1900, 2200, 2500], seasons: "S1–S4" },
  { slug: "shattered-arkanis", name: "Shattered Arkanis", stages: [1600, 1900, 2200, 2500], seasons: "S1–S4" },
  { slug: "submerged-life-temple", name: "Submerged Life Temple", stages: [2400, 2800, 3200, 3500], seasons: "S2–S3 (dès le 16/12/2026)" },
  { slug: "mirror-of-scarlet-desire", name: "Mirror of Scarlet Desire", stages: [3200, 3500, 3800, 4000], seasons: "S3 (dès le 10/03/2027)" },
  { slug: "abyssal-horn-den", name: "Abyssal Horn Den", stages: [3800, 4100, 4500, 4800], seasons: "non programmé" },
];

/** Échelle d'équipement des donjons d'Expédition (Conquête) */
export const EXPEDITION_GEAR = [
  { itemLevel: 54, dungeons: ["Krao Cave", "Draupnir"], slugs: ["krao-cave", "draupnir"], boss: "Ultimate Berk / Transcendent Bakarma" },
  { itemLevel: 70, dungeons: ["Urugugu Canyon", "Vakron Sky Island"], slugs: ["urugugu-canyon", "vakron-sky-island"], boss: "Divine Auldor / Vakron" },
  { itemLevel: 86, dungeons: ["Fire Temple", "Ferocious Horn Den"], slugs: ["fire-temple", "ferocious-horn-den"], boss: "Kromede's Desire / Ferocious Horn Nuakum" },
  { itemLevel: 102, dungeons: ["Abyssal Forge: Ludra (raid)", "Craft Splendent Wise/Ebony Dragon Lord"], slugs: ["abyssal-forge-ludra"], boss: "Eternal Ludra" },
];

export const STIGMA_SLOT_LEVELS = [22, 27, 32, 37];
export const DAEVANION_BOARD_LEVELS: Record<string, { level: number; points: number }> = {
  Nezekan: { level: 12, points: 134 },
  Zikel: { level: 20, points: 134 },
  Vaizel: { level: 30, points: 134 },
  Triniel: { level: 40, points: 168 },
  Azphel: { level: 45, points: 232 },
};

export const ASCENSION_QUESTS = [
  { step: 1, level: 5, name: "The One Who Perceives" },
  { step: 2, level: 22, name: "Ascension (étape 2)" },
  { step: 3, level: 32, name: "Ascension (étape 3)" },
  { step: 4, level: 45, name: "The One Who Witnesses the Nightmare" },
  { step: 5, level: 49, name: "The One Who Swears the Oath" },
];

export const NIGHTMARE_LAYERS = [
  { layer: 1, opening: ["Gatekeeper Pinopi", "Furious Feruk", "Fafnir's Poison Blood", "Wraith Giselle"], second: ["Fortress Guardian Notun", "Mutated Gerod"], capstone: "Zikel's Apparition", power: "1 000 – 3 000" },
  { layer: 2, opening: ["Mutated Ulgorn", "Soulreaper Rathman", "Sharp Aulak", "Sealed Sura"], second: ["Enraged Reda", "Warden Santras"], capstone: "Kaisinel's Illusion", power: "2 500 – 3 950" },
  { layer: 3, opening: ["Sanctum Guardian Gauss", "Ritualist Aulisa", "Root Mythical Bird Aultross", "Oathbreaker Gartua"], second: ["Incarnated Warding Feather", "Modified Bargott"], capstone: "Tyrant Tassin", power: "3 000 – 4 200" },
  { layer: 4, opening: ["Lieutenant Hebran", "Kromede's Desire"], second: ["Culminant Paton", "Scout Captain Ked"], capstone: "Ascended Atheron", power: "3 500 – 4 950" },
];
