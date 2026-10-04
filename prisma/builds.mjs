/**
 * Builds de départ (un par classe), rédigés par Claude à partir :
 *  - des choix réels des meilleurs joueurs du serveur GLOBAL (taux de choix, niveaux, équipement, stats) ;
 *  - de l'analyse des compétences du client global (recharges, cibles, buffs, spécialisations).
 * Ils sont envoyés au site via le serveur MCP (outil create_build) par `npm run db:seed`.
 */

/** Spécialisation n (1..5) d'une compétence */
const sp = (skillId, n) => skillId + n * 10;
const sk = (skillId, targetLevel, priority, specs = [], note) => ({
  skillId,
  targetLevel,
  priority,
  specializations: specs.map((n) => sp(skillId, n)),
  ...(note ? { note } : {}),
});
const st = (slot, stigmaId, targetLevel, note, alternatives = []) => ({ slot, stigmaId, targetLevel, note, alternatives });

const PATCH = "global 0.0.4387.0 · saison 1";
const SOURCES = ["https://metabot.gg/en/aion-2/classes", "https://metabot.gg/en/aion-2/guides/class-builds-guide", "https://metabot.gg/en/aion-2/guides/endgame-guide"];

/** Équipement cible commun : palier IL 86 (Fire Temple / Ferocious Horn Den) avec transitions 54 → 70 */
function gear(weapon, { offhandNote, armorNote } = {}) {
  return [
    {
      slot: "MainHand",
      name: weapon.t86,
      itemSlug: weapon.slug86,
      enchant: 10,
      source: "Fire Temple (Conquête) — boss Kromede's Desire",
      note: "Monte l'arme en priorité : c'est la pièce qui compte le plus. Objectif long terme : arme de Ludra (raid) ou Splendent Wise Dragon Lord (IL 102).",
      alternatives: [weapon.t70, weapon.t54, `Spiritforged ${weapon.suffix}`],
    },
    {
      slot: "OffHand",
      name: "Nuakum Guard",
      enchant: 10,
      source: "Ferocious Horn Den (Exploration ou Conquête) / 3 Gear Change Vouchers",
      note: offhandNote ?? "Garde tes Gear Change Vouchers : la garde est garantie via Substance Morph.",
      alternatives: ["Vakron Guard", "Bakarma Guard", "Spiritforged Guard"],
    },
    ...[
      ["Helmet", "Helm"],
      ["Shoulders", "Pauldrons"],
      ["Chest", "Breastplate"],
      ["Legs", "Greaves"],
      ["Gloves", "Gloves"],
      ["Boots", "Boots"],
      ["Cape", "Cloak"],
    ].map(([slot, piece]) => ({
      slot,
      name: `Nuakum ${piece}`,
      enchant: 10,
      source: "Ferocious Horn Den (même butin en Exploration et en Conquête)",
      note: slot === "Chest" ? armorNote : undefined,
      alternatives: [`Vakron ${piece}`, `Bakarma ${piece}`],
    })),
    { slot: "Necklace", name: "Enraged Kromede Necklace", enchant: 10, source: "Fire Temple (Conquête) / voucher → coffre d'accessoire", alternatives: ["Aulamus Necklace"] },
    { slot: "Earring1", name: "Enraged Kromede Earrings", enchant: 10, source: "Fire Temple (Conquête)", alternatives: ["Aulamus Earrings"] },
    { slot: "Earring2", name: "Enraged Kromede Earrings", enchant: 10, source: "Fire Temple (Conquête)", alternatives: ["Aulamus Earrings"] },
    { slot: "Ring1", name: "Enraged Kromede Ring", enchant: 10, source: "Fire Temple (Conquête)", alternatives: ["Aulamus Ring"] },
    { slot: "Ring2", name: "Enraged Kromede Ring", enchant: 10, source: "Fire Temple (Conquête)", alternatives: ["Aulamus Ring"] },
    { slot: "Bracelet1", name: "Ascension Bracelet", enchant: 10, source: "Récompense d'Ascension", note: "Porté par plus de 50 % des meilleurs joueurs, monté à +9." },
    { slot: "Bracelet2", name: "Ascension Bracelet", enchant: 10, source: "Récompense d'Ascension", alternatives: ["Liberator Bracelet"] },
    { slot: "Belt", name: "Noble Belt", enchant: 10, source: "Quête, puis Substance Morph à +10", note: "Ne se remplace jamais : on la monte à +10 puis on la convertit au grade supérieur." },
    { slot: "Amulet", name: "Revelation Amulet", enchant: 10, source: "Quête, puis Substance Morph à +10", note: "Même logique que la ceinture." },
    { slot: "Rune1", name: "Clash Rune", source: "Seule rune existante au lancement" },
  ];
}

const VIGOR_ARCANA = [
  { slot: 1, name: "Chalice of Vigor", itemSlug: "chalice-of-vigor", note: "Time [Siel]" },
  { slot: 2, name: "Parchment of Vigor", itemSlug: "parchment-of-vigor", note: "Life [Yustiel]" },
  { slot: 3, name: "Compass of Vigor", itemSlug: "compass-of-vigor", note: "Freedom [Vaizel]" },
  { slot: 4, name: "Bell of Vigor", itemSlug: "bell-of-vigor", note: "Justice [Nezekan]" },
  { slot: 5, name: "Mirror of Vigor", itemSlug: "mirror-of-vigor", note: "Illusion [Kaisinel]" },
];
const DEITY_DPS = ["Time [Siel]", "Justice [Nezekan]", "Death [Triniel]", "Freedom [Vaizel]", "Space [Israphel]"];

const common = (extra = {}) => ({ arcana: VIGOR_ARCANA, sources: SOURCES, pvpSwaps: [], ...extra });

export const BUILDS = [
  // ===================================================================== GLADIATEUR
  {
    title: "Gladiateur — Fléau des packs (PvE endgame)",
    classId: "gladiator",
    mode: "PVE",
    role: "DPS / Off-tank",
    featured: true,
    tags: ["Transcendance", "Conquête", "Raid"],
    patch: PATCH,
    summary:
      "Le build des meilleurs gladiateurs du serveur global : Ruinous Blow et Overhead Slam au cœur, stigmas de burst (Lunge Stance + Zikel's Blessing) et une solidité qui permet d'encaisser à la place du tank.",
    description:
      "## Philosophie\nLe Gladiateur tire sa survie de ses **passifs** (Survival Stance, Blood Absorption), ce qui libère les 4 stigmas pour les dégâts. On ouvre chaque combat sous double buff (vitesse + attaque) et on garde **Ruinous Blow** (Prepare for Battle : +20 % de dégâts PvE pendant 20 s, recharge 45 s) actif le plus souvent possible.\n\n## Progression\n- **1 → 37** : Wrath Wave puis Lifestealing Blade dans les premiers emplacements, idéal en solo.\n- **45** : bascule vers le set des meilleurs joueurs ci-dessous.",
    data: {
      overview: {
        playstyle:
          "Combattant au corps à corps qui frappe jusqu'à 4 ennemis avec presque tout son kit. On ouvre sous Lunge Stance + Zikel's Blessing, on enchaîne Ruinous Blow → Overhead Slam → Rage Burst, puis on comble avec Rending Blow / Keen Strike qui rendent du mana.",
        strengths: ["Excellent en multi-cibles (10 attaques AoE)", "Très résistant grâce aux passifs, peut dépanner en tank", "Burst court mais énorme sous double buff"],
        weaknesses: ["Burst concentré sur 10 s toutes les 60-120 s", "Corps à corps : subit les mécaniques au sol", "Peu de contrôle à distance"],
        difficulty: 2,
        content: ["Transcendance", "Conquête", "Raid", "Cauchemar"],
      },
      skills: [
        sk(11100000, 10, 1, [3, 4], "Prepare for Battle : +20 % de dégâts PvE pendant 20 s toutes les 45 s. La compétence à monter en premier."),
        sk(11170000, 10, 2, [2, 4], "Recharge de 5 s : la passer en AoE (spé 2) puis critique garanti (spé 4, niv. 12)."),
        sk(11010000, 10, 3, [1, 4], "Attaque de base sans recharge, 4 cibles. -20 % de mana puis bonus sur peu de cibles (boss)."),
        sk(11020000, 10, 4, [3, 4], "Rend 100 PM. La spé 4 réduit la recharge de Ruinous Blow à chaque coup."),
        sk(11750000, 10, 5, [], "+5,5 % de dégâts PvE : le passif le plus rentable."),
        sk(11740000, 10, 6, [], "Choisi par 99 % des meilleurs joueurs (niv. moyen 13,6)."),
        sk(11780000, 10, 7, [], "Contre-attaque débloquée au niveau 21."),
        sk(11050000, 7, 8, [3], "AoE 20 s ; avec les nœuds Daevanion elle atteint le niveau 8 pour la spé +20 % sur plusieurs cibles."),
        sk(11190000, 7, 9, [1], "Engagement + Prepare for Battle 3 s (spé 1)."),
        sk(11710000, 7, 10, [], "+7 % de PV max."),
        sk(11730000, 7, 11, [], "Soigne 26 % des PV sous la moitié de vie."),
        sk(11800000, 7, 12, [], "Passif niveau 25, doublé sur le plateau Zikel."),
        sk(11760000, 5, 13, [], "Bonus d'impact."),
        sk(11290000, 4, 14, [], "Mocking Blade → Overhead Slam en ouverture ; reste bas en points."),
      ],
      stigmas: [
        st(1, 11400000, 10, "+20 % de vitesse de combat 10 s : plus de coups = plus de dégâts. 91 % des meilleurs joueurs.", [11240000]),
        st(2, 11250000, 10, "+20 % d'attaque et +100 de précision 10 s. À caler avec Lunge Stance.", [11340000]),
        st(3, 11390000, 8, "Gros coup mono-cible + Wounded (-10 % d'attaque ennemie).", [11080000]),
        st(4, 11110000, 5, "Parade garantie + PM/endurance : la survie sur les grosses attaques de boss.", [11380000, 11340000]),
      ],
      rotation: [
        { title: "Ouverture (boss)", steps: [11290000, 11170000, 11400000, 11250000, 11100000, 11390000, 11050000, 11170000], note: "Les deux buffs juste avant Ruinous Blow pour que les 10 s couvrent le burst." },
        { title: "Packs (Conquête / Transcendance)", steps: [11190000, 11100000, 11050000, 11170000, 11280000, 11010000], note: "Leaping Slam pour engager, puis tout ce qui touche 4 cibles." },
        { title: "Remplissage", steps: [11010000, 11020000, 11170000, 11010000, 11020000], note: "Keen Strike rend du mana et réduit la recharge de Ruinous Blow (spé 4)." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Paires de nœuds d'Attack Preparation et Survival Stance, puis Overhead Slam et Rending Blow (98 % / 97 % des meilleurs joueurs).", skillNodes: [11170000, 11010000, 11750000, 11710000] },
          { board: "Zikel", focus: "Rending Blow, Overhead Slam, Ruinous Blow, puis la paire Murderous Burst.", skillNodes: [11010000, 11170000, 11100000, 11800000] },
          { board: "Vaizel", focus: "Rending Blow +1, puis stats offensives (critique, vitesse de combat).", skillNodes: [11010000, 11020000] },
          { board: "Triniel", focus: "Overhead Slam +1 puis Crushing Wave pour débloquer sa spécialisation.", skillNodes: [11170000, 11050000] },
          { board: "Azphel", focus: "Uniquement des stats (232 points) : à remplir en dernier." },
        ],
        statPriority: ["Attaque", "Coup critique", "Vitesse de combat", "PV max"],
        notes: "Les nœuds ronds poussent les compétences au-delà du niveau 10 (+4 max) et débloquent ainsi les spécialisations de niveau 12.",
      },
      gear: gear({ t86: "Enraged Kromede Claymore", slug86: "enraged-kromede-claymore", t70: "Aulamus Greatsword", t54: "Rupture Claymore", suffix: "Greatsword" }),
      manastones: [
        { stat: "Attack", priority: 1 },
        { stat: "Critical Hit", priority: 2 },
        { stat: "Accuracy Bonus", priority: 3, note: "jusqu'à ne plus rater les boss" },
        { stat: "HP", priority: 4 },
      ],
      theostone: { name: "Théostone élémentaire de zone (AoE)", note: "10 de vos attaques touchent plusieurs cibles : un proc AoE paie jusqu'à 4 fois." },
      stats: { primary: ["Might", "Constitution", "Dexterity", "Willpower"], deity: DEITY_DPS },
      tips: [
        "Ruinous Blow couvre presque la moitié de chaque combat : ne le gardez jamais en réserve.",
        "Lunge Stance et Zikel's Blessing durent 10 s : lancez-les ensemble, juste avant votre plus gros enchaînement.",
        "En leveling (avant 37), Lifestealing Blade remplace avantageusement Rage Burst : gros coefficient et soin.",
        "Focused Block garantit la parade : gardez-le pour les attaques télégraphiées des boss de Transcendance.",
      ],
      ...common({ pvpSwaps: [{ from: 11110000, to: 11430000, why: "Forced Restraint applique Sceau (75 %) : coupe les sorts adverses." }] }),
    },
  },

  // ===================================================================== TEMPLIER
  {
    title: "Templier — Rempart de la team (Tank PvE)",
    classId: "templar",
    mode: "PVE",
    role: "Tank",
    featured: true,
    tags: ["Tank", "Transcendance", "Raid"],
    patch: PATCH,
    summary:
      "Le tank pur de la team : aggro solide avec Taunt et Empyrean Lord's Punishment, buff Executor via Punishment (+20 % de dégâts PvE) et Warding Strike pour encaisser.",
    description:
      "## Rôle\nTenir l'aggro, placer les boss, encaisser les mécaniques. Le Templier apporte aussi **Executor** (+200 de précision, +20 % de dégâts PvE pendant 20 s) via Punishment : un des plus gros buffs personnels du jeu.\n\n## Astuce de groupe\nAnnoncez Nezekan's Shield (bouclier de groupe de 41 % des PV max) sur les gros dégâts de zone si vous le jouez à la place de Shield of Protection.",
    data: {
      overview: {
        playstyle:
          "On ouvre avec Taunt et Empyrean Lord's Punishment (étourdissement de 4 cibles, toujours réussi sur les PNJ), on garde Warding Strike pour la réduction de dégâts et on maintient Punishment pour Executor.",
        strengths: ["Seul tank pur : indispensable en raid", "Aggro multi-cibles fiable", "Gros buff personnel (Executor)"],
        weaknesses: ["Dégâts modestes en solo", "Dépend de l'équipement défensif", "Rotation de recharges à surveiller"],
        difficulty: 3,
        content: ["Raid", "Transcendance", "Conquête"],
      },
      skills: [
        sk(12090000, 10, 1, [3, 4], "Executor : +200 précision, +20 % de dégâts PvE 20 s. Vitesse +30 % (spé 3) puis mobile (spé 4)."),
        sk(12350000, 10, 2, [1, 4], "Réduction de dégâts : -5 s de recharge, puis tolérance accrue selon le nombre de cibles."),
        sk(12240000, 10, 3, [3, 4], "Recharge 5 s : dégâts bonus puis critique garanti."),
        sk(12010000, 10, 4, [3, 4], "Attaque de base ; la spé 4 réduit la recharge de Warding Strike."),
        sk(12710000, 10, 5, [], "+7,5 % de PV max et +6 % de soins reçus."),
        sk(12780000, 10, 6, [], "Fury : +5,5 % de dégâts PvE au groupe sur blocage."),
        sk(12740000, 10, 7, [], "+7 % de défense."),
        sk(12100000, 8, 8, [1], "Étourdissement 4 cibles, recharge 10 s. Spé 1 : +1 s d'étourdissement ; à 12 : -2 s de recharge."),
        sk(12040000, 7, 9, [], "Le niveau 8 via Daevanion ouvre la spé qui réduit la recharge de Punishment."),
        sk(12730000, 7, 10, [], "Passif choisi par 98 % des meilleurs."),
        sk(12770000, 7, 11, [], "Insulting Roar : +100 % de génération d'aggro."),
        sk(12800000, 7, 12, [], "Block Pain : renvoi de dégâts sur blocage."),
        sk(12760000, 5, 13, [], ""),
      ],
      stigmas: [
        st(1, 12310000, 10, "Étourdissement 4 cibles à 20 m, 50 dégâts de jauge de stagger : la meilleure prise d'aggro.", [12070000]),
        st(2, 12120000, 8, "Taunt : aggro forcée + rétrécissement. Joué par 76 % des meilleurs templiers.", [12320000]),
        st(3, 12450000, 8, "Attaque proportionnelle à la défense : votre principal gain de DPS.", [12410000]),
        st(4, 12110000, 5, "Blocage garanti + mana sur les gros coups de boss.", [12320000, 12230000]),
      ],
      rotation: [
        { title: "Prise d'aggro", steps: [12120000, 12310000, 12090000, 12100000, 12240000], note: "Taunt d'abord, puis l'étourdissement de zone pour coller les mobs." },
        { title: "Boss", steps: [12090000, 12450000, 12350000, 12240000, 12010000, 12240000], note: "Punishment pour Executor, Battlefield Banner en même temps, Warding Strike avant les grosses attaques." },
        { title: "Défensif", steps: [12110000, 12350000, "Noble Armor si joué"], note: "Shield of Protection sur l'attaque télégraphiée, Warding Strike juste après." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Paires Enhance Health, Ironclad Defense et Guarding Seal ; Judgment et Warding Strike.", skillNodes: [12240000, 12350000, 12010000, 12730000] },
          { board: "Zikel", focus: "Punishment (nœud le plus pris), Vicious Strike, Judgment, puis Fury et Insulting Roar.", skillNodes: [12090000, 12010000, 12240000, 12780000] },
          { board: "Vaizel", focus: "Shield Smite pour sa spé de niveau 12, puis défense/blocage.", skillNodes: [12100000] },
          { board: "Triniel", focus: "Judgment +1 puis PV max.", skillNodes: [12240000] },
          { board: "Azphel", focus: "Stats défensives uniquement." },
        ],
        statPriority: ["PV max", "Défense", "Blocage", "Attaque"],
      },
      gear: gear({ t86: "Enraged Kromede Sword", slug86: "enraged-kromede-sword", t70: "Aulamus Longsword", t54: "Rupture Sword", suffix: "Longsword" }, {
        offhandNote: "Pour le tank, la garde passe AVANT les autres pièces d'armure.",
      }),
      manastones: [
        { stat: "Defense", priority: 1 },
        { stat: "Block", priority: 2 },
        { stat: "HP", priority: 3 },
        { stat: "Accuracy Bonus", priority: 4, note: "pour que Taunt et les étourdissements touchent" },
      ],
      theostone: { name: "Théostone de réduction de vitesse de combat", note: "Le seul proc qui ralentit la vitesse d'attaque de la cible : idéal pour un tank." },
      stats: { primary: ["Might", "Constitution", "Dexterity", "Willpower"], deity: ["Justice [Nezekan]", "Time [Siel]", "Death [Triniel]", "Freedom [Vaizel]"] },
      tips: [
        "Warding Strike et Shield of Protection ne se chevauchent pas : alternez-les sur les grosses attaques.",
        "Pour le solo, Doom Shield (charge + renversement + petit bouclier) remplace Taunt.",
        "Si le groupe manque de soins, Nezekan's Shield (bouclier de 41 % des PV max pour le groupe) remplace Shield of Protection.",
      ],
      ...common({ pvpSwaps: [{ from: 12120000, to: 12070000, why: "Doom Shield : engagement et renversement sur les soigneurs." }] }),
    },
  },

  // ===================================================================== ASSASSIN
  {
    title: "Assassin — Insignes & critiques (PvE endgame)",
    classId: "assassin",
    mode: "PVE",
    role: "DPS mêlée",
    featured: true,
    tags: ["Burst", "Transcendance", "Mono-cible"],
    patch: PATCH,
    summary:
      "Graver 5 Insignes, les faire exploser, et déclencher Heart Gore à chaque critique. Illusive Clone + Swift Contract pour des fenêtres de burst parmi les plus violentes du jeu.",
    data: {
      overview: {
        playstyle:
          "Tout tourne autour des Insignes : Savage Fang en grave 5 d'un coup, Insignia Explosion les consomme. Heart Gore se déclenche sur coup critique et rend du mana ; Illusive Clone supprime sa recharge et ajoute 20 % de dégâts pendant 10 s.",
        strengths: ["Meilleur burst mono-cible", "Très mobile", "Excellent sur les boss de Transcendance"],
        weaknesses: ["Fragile au corps à corps", "Dégâts dépendants du positionnement (dos)", "Rotation exigeante"],
        difficulty: 4,
        content: ["Transcendance", "Cauchemar", "Raid"],
      },
      skills: [
        sk(13350000, 10, 1, [2, 4], "Se déclenche sur critique, 4 cibles, rend 100 PM. Spé 2 : grave 1 Insigne ; spé 4 : Multi-Hit."),
        sk(13130000, 10, 2, [3, 2], "Garder 2 Insignes après l'explosion (spé 3) : énorme gain de cycle."),
        sk(13010000, 10, 3, [3, 4], "Attaque de base ; la spé 4 réduit la recharge d'Insignia Explosion."),
        sk(13100000, 10, 4, [2, 3], "Grave 1 Insigne ; vitesse +20 % puis dégâts sur peu de cibles."),
        sk(13750000, 10, 5, [], "Assault Stance : +6 % de dégâts critiques."),
        sk(13720000, 10, 6, [], "Exploit Weakness : +100 critique, clones critiques qui gravent des Insignes."),
        sk(13740000, 10, 7, [], "Rear Smite : bonus de dégâts dans le dos."),
        sk(13060000, 8, 8, [1], "Ambush : +30 % de dos ; spé 1 grave 2 Insignes sur attaque dans le dos."),
        sk(13070000, 7, 9, [2], "Étourdissement ; spé 2 : +20 % de dégâts critiques 10 s (via Daevanion)."),
        sk(13050000, 7, 10, [], ""),
        sk(13780000, 7, 11, [], "Defense Break : -12 % de défense sur les cibles en stagger."),
        sk(13800000, 7, 12, [], ""),
        sk(13710000, 5, 13, [], ""),
      ],
      stigmas: [
        st(1, 13270000, 10, "Grave les 5 Insignes en une pression : le cœur du build.", [13020000]),
        st(2, 13300000, 10, "Gros coup mono-cible qui amplifie les dégâts subis par la cible.", []),
        st(3, 13310000, 10, "Supprime la recharge de Heart Gore + 20 % de dégâts en plus pendant 10 s. 95 % des meilleurs assassins.", []),
        st(4, 13390000, 8, "+20 % de vitesse de combat : plus de coups, plus de critiques, plus de Heart Gore.", [13080000]),
      ],
      rotation: [
        { title: "Burst", steps: [13390000, 13310000, 13270000, 13130000, 13350000, 13300000, 13350000], note: "Swift Contract et Illusive Clone ensemble, puis vider les Insignes." },
        { title: "Cycle normal", steps: [13100000, 13010000, 13060000, 13130000, 13350000], note: "Recharger les Insignes avec Savage Roar / Ambush de dos avant chaque explosion." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Paires Assault Stance et Exploit Weakness, puis Heart Gore et Quick Slice.", skillNodes: [13350000, 13010000, 13750000, 13720000] },
          { board: "Zikel", focus: "Insignia Explosion, Heart Gore, Quick Slice, puis Defense Break.", skillNodes: [13130000, 13350000, 13010000, 13780000] },
          { board: "Vaizel", focus: "Heart Gore et Insignia Explosion +1.", skillNodes: [13350000, 13130000] },
          { board: "Triniel", focus: "Heart Gore +1 (atteint la spé de niveau 16 à long terme).", skillNodes: [13350000] },
          { board: "Azphel", focus: "Critique et dégâts critiques." },
        ],
        statPriority: ["Coup critique", "Dégâts critiques", "Attaque", "Vitesse de combat"],
      },
      gear: gear({ t86: "Enraged Kromede Silver Dagger", slug86: "enraged-kromede-silver-dagger", t70: "Aulamus Dagger", t54: "Rupture Knife", suffix: "Dagger" }),
      manastones: [
        { stat: "Critical Hit", priority: 1 },
        { stat: "Attack", priority: 2 },
        { stat: "Critical Damage Boost", priority: 3 },
        { stat: "Accuracy Bonus", priority: 4 },
      ],
      theostone: { name: "Théostone mono-cible à faible chance / gros dégâts", note: "Vos coups rapides tombent rarement sur la recharge d'1 s d'une pierre à 1-2 %." },
      stats: { primary: ["Might", "Dexterity", "Constitution", "Willpower"], deity: DEITY_DPS },
      tips: [
        "Placez-vous dans le dos : Ambush, Rear Smite et Ambush Stance en dépendent.",
        "Ne lancez jamais Insignia Explosion avec moins de 5 Insignes hors urgence.",
        "En PvP, Aerial Bind (Airborne garanti sur une cible à 5 Insignes) remplace Swift Contract.",
      ],
      ...common({ pvpSwaps: [{ from: 13390000, to: 13230000, why: "Airborne garanti sur une cible à 5 Insignes." }] }),
    },
  },

  // ===================================================================== RÔDEUR
  {
    title: "Rôdeur — Tempête de flèches (PvE distance)",
    classId: "ranger",
    mode: "PVE",
    role: "DPS distance",
    featured: true,
    tags: ["Distance", "Transcendance", "Raid"],
    patch: PATCH,
    summary:
      "Le build des meilleurs rôdeurs du serveur global (puissance médiane la plus haute du jeu) : Gale + Precision maintenus en permanence, Vaizel's Authority et Bow of Blessing pour des fenêtres de critiques.",
    data: {
      overview: {
        playstyle:
          "On combat à 20 m en entretenant deux buffs : Gale (Gale Arrow, +7 % vitesse et dégâts PvE) et Precision (Marking Shot, +300 critique). Deadshot est le gros coup chargé ; Snare Shot ralentit le pack pour activer Rooting Eye.",
        strengths: ["Plus haute puissance médiane du serveur global", "Dégâts à distance, sûr sur les mécaniques", "Bons dégâts de zone"],
        weaknesses: ["Deux buffs à entretenir", "Faible en face-à-face au corps à corps", "Dépend de la précision"],
        difficulty: 3,
        content: ["Transcendance", "Raid", "Conquête", "Abysses"],
      },
      skills: [
        sk(14110000, 10, 1, [1, 4], "Gale : +5 s de durée (15 s pour 20 s de recharge), puis bonus sur peu de cibles."),
        sk(14010000, 10, 2, [2, 4], "Gros coup chargé : +30 % de vitesse, puis ignore blocage/esquive."),
        sk(14020000, 10, 3, [3, 4], "Attaque de base ; spé 4 : -1 s sur Deadshot à chaque coup."),
        sk(14340000, 10, 4, [2, 3], "+10 % de critique sur la compétence puis bonus mono-cible."),
        sk(14080000, 10, 5, [2, 4], "Multi-Hit puis +20 % de dégâts sur peu de cibles."),
        sk(14750000, 10, 6, [], "Hunter's Resolve : +6 % de dégâts critiques."),
        sk(14740000, 10, 7, [], "Focused Eye : nœud doublé sur Nezekan."),
        sk(14050000, 8, 8, [3], "Recharge 5 s ; vitesse puis Multi-Hit à 12."),
        sk(14090000, 7, 9, [3], "Precision (+300 critique) ; spé 3 : +5 s de durée."),
        sk(14800000, 7, 10, [], "Hunter's Soul (niv. 25)."),
        sk(14770000, 7, 11, [], "Rooting Eye : coups bonus sur cibles ralenties/immobilisées."),
        sk(14720000, 7, 12, [], ""),
        sk(14710000, 5, 13, [], ""),
      ],
      stigmas: [
        st(1, 14310000, 10, "+20 % d'attaque 10 s. 93 % des meilleurs rôdeurs.", [14270000]),
        st(2, 14220000, 10, "+200 critique et +100 précision 10 s : à caler avec Vaizel's Authority.", [14360000]),
        st(3, 14380000, 8, "Orbe de tir de soutien 15 s : dégâts passifs pendant votre rotation.", []),
        st(4, 14060000, 6, "AoE feu 4 cibles : packs de Conquête et Transcendance.", [14360000, 14270000]),
      ],
      rotation: [
        { title: "Ouverture", steps: [14090000, 14110000, 14310000, 14220000, 14380000, 14010000, 14080000, 14340000], note: "Precision et Gale d'abord, les deux buffs de stigma, puis Deadshot." },
        { title: "Packs", steps: [14130000, 14060000, 14110000, 14080000, 14050000], note: "Snare Shot ralentit le pack : Rooting Eye et Explosive Arrow en profitent." },
        { title: "Remplissage", steps: [14020000, 14340000, 14050000, 14020000], note: "Snipe réduit la recharge de Deadshot." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Paires Hunter's Resolve et Focused Eye ; Tempest Shot, Drill Dart, Snipe et Gale Arrow.", skillNodes: [14340000, 14050000, 14020000, 14110000] },
          { board: "Zikel", focus: "Snipe, Deadshot, Tempest Shot, Gale Arrow ; puis Rooting Eye et Hunter's Soul.", skillNodes: [14020000, 14010000, 14340000, 14110000] },
          { board: "Vaizel", focus: "Marking Shot pour atteindre le niveau 8, puis critique.", skillNodes: [14090000] },
          { board: "Triniel", focus: "Gale Arrow vers la spé de niveau 16 (-10 s de recharge).", skillNodes: [14110000] },
          { board: "Azphel", focus: "Critique, précision." },
        ],
        statPriority: ["Coup critique", "Attaque", "Précision", "Vitesse de combat"],
      },
      gear: gear({ t86: "Enraged Kromede Longbow", slug86: "enraged-kromede-longbow", t70: "Aulamus Bow", t54: "Rupture Longbow", suffix: "Bow" }),
      manastones: [
        { stat: "Critical Hit", priority: 1 },
        { stat: "Attack", priority: 2 },
        { stat: "Accuracy Bonus", priority: 3 },
        { stat: "Weapon Damage Boost", priority: 4 },
      ],
      theostone: { name: "Théostone de zone (AoE)", note: "En PvP : réduction de vitesse de déplacement pour kiter." },
      stats: { primary: ["Might", "Constitution", "Dexterity", "Willpower"], deity: DEITY_DPS },
      tips: [
        "La spé +5 s de Gale Arrow est la première à prendre : Gale tient 15 s sur 20 s de recharge.",
        "Gardez vos 20 m : la plupart des boss de Transcendance frappent autour d'eux.",
        "En leveling, Arrow Storm puis Explosive Arrow dans les premiers emplacements nettoient les packs bien plus vite.",
      ],
      ...common({ pvpSwaps: [{ from: 14060000, to: 14160000, why: "Sealing Arrow : Sceau à 75 % sur un lanceur de sorts." }] }),
    },
  },

  // ===================================================================== SORCIER
  {
    title: "Sorcier — Brasier (PvE burst feu)",
    classId: "sorcerer",
    mode: "PVE",
    role: "DPS magique",
    featured: true,
    tags: ["Burst", "Feu", "Transcendance"],
    patch: PATCH,
    summary:
      "Hellfire et Firestorm se nourrissent l'un l'autre, Element Enhancement + Delayed Explosion pour le burst, et une gestion du mana stricte pour garder Grace of Enhancement (+20 % de dégâts PvE).",
    data: {
      overview: {
        playstyle:
          "Lanceur de sorts de feu. Firestorm (5 s) réduit la recharge de Hellfire de 2 s par boule de feu (spé niv. 12) ; Blaze rend du mana. Grace of Enhancement donne +20 % de dégâts PvE tant que le mana reste au-dessus de 25 % : tout le build protège la barre de mana.",
        strengths: ["Énorme burst de zone", "À distance", "Contrôles d'eau (gel) en secours"],
        weaknesses: ["Très dépendant du mana", "Fragile (pas de passif de PV)", "Temps d'incantation"],
        difficulty: 4,
        content: ["Transcendance", "Conquête", "Raid"],
      },
      skills: [
        sk(15060000, 10, 1, [1, 4], "Gros sort chargé de zone. +30 % de vitesse puis ignore blocage/esquive."),
        sk(15040000, 10, 2, [1, 4], "-50 % de mana (spé 1) puis -2 s de recharge de Hellfire par boule (spé 4)."),
        sk(15050000, 10, 3, [2, 4], "Rend du mana (+50 % avec la spé 2) ; recharge 5 s sur cibles marquées."),
        sk(15210000, 10, 4, [3, 4], "Sort de base ; Multi-Hit puis +5 % de dégâts de feu."),
        sk(15310000, 10, 5, [2, 4], "Buff 60 s : +10 % d'attaque puis +10 % de vitesse de combat."),
        sk(15740000, 10, 6, [], "Robe of Flame : passif le plus monté chez les meilleurs (14,1)."),
        sk(15780000, 10, 7, [], "Grace of Enhancement : +20 % de dégâts PvE au-dessus de 25 % de mana."),
        sk(15280000, 8, 8, [1], ""),
        sk(15110000, 7, 9, [3], "Spé 3 : +20 % de dégâts PvE 5 s quand il touche."),
        sk(15710000, 7, 10, [], "Fire Mark."),
        sk(15720000, 7, 11, [], "Robe of Earth : +7 % de mana max, +105 critique au-dessus de 50 % de mana."),
        sk(15800000, 7, 12, [], ""),
        sk(15760000, 5, 13, [], "Absorb Essence : mana sur coup."),
      ],
      stigmas: [
        st(1, 15390000, 8, "Mur de feu de zone : excellent sur les packs.", [15200000]),
        st(2, 15400000, 10, "+20 % d'attaque de feu et d'eau 10 s. 93 % des meilleurs sorciers.", []),
        st(3, 15320000, 8, "Explosion retardée à recharge courte (30 s).", [15120000]),
        st(4, 15160000, 6, "Bouclier de 16 % des PV max pendant 60 s : la survie qui manque au sorcier.", [15360000, 15200000]),
      ],
      rotation: [
        { title: "Ouverture", steps: [15310000, 15400000, 15320000, 15060000, 15040000, 15050000, 15040000], note: "Wish of Concentration et Element Enhancement avant Hellfire." },
        { title: "Cycle", steps: [15040000, 15050000, 15210000, 15040000, 15060000], note: "Chaque Firestorm rapproche Hellfire. Blaze dès qu'il est prêt pour le mana." },
        { title: "Mana bas", steps: [15050000, 15210000, "attendre > 25 % PM"], note: "Sous 25 % de mana, Grace of Enhancement s'éteint : rien ne vaut ce bonus." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Blaze, Firestorm, Hellfire, Flame Arrow ; paires Fire Mark et Robe of Earth.", skillNodes: [15050000, 15040000, 15060000, 15210000] },
          { board: "Zikel", focus: "En priorité dès le niveau 20 : la paire Grace of Enhancement, puis Hellfire et Flame Arrow.", skillNodes: [15060000, 15210000, 15040000, 15780000] },
          { board: "Vaizel", focus: "Wish of Concentration +1.", skillNodes: [15310000] },
          { board: "Triniel", focus: "Hellfire vers sa spé de niveau 16 (-15 s de recharge).", skillNodes: [15060000] },
          { board: "Azphel", focus: "Mana max, critique." },
        ],
        statPriority: ["Attaque", "Coup critique", "PM max", "Vitesse d'incantation"],
      },
      gear: gear({ t86: "Enraged Kromede Spellbook", slug86: "enraged-kromede-spellbook", t70: "Aulamus Spellbook", t54: "Rupture Tome", suffix: "Spellbook" }),
      manastones: [
        { stat: "Attack", priority: 1 },
        { stat: "Critical Hit", priority: 2 },
        { stat: "MP", priority: 3, note: "si le mana tombe souvent sous 25 %" },
        { stat: "Accuracy Bonus", priority: 4 },
      ],
      theostone: { name: "Théostone de feu de zone (AoE)", note: "Sceau en PvP." },
      stats: { primary: ["Might", "Constitution", "Dexterity", "Willpower"], deity: DEITY_DPS },
      tips: [
        "Surveillez votre mana : Grace of Enhancement (+20 %) s'éteint sous 25 %.",
        "Sur les boss avec jauge de stagger, Divine Burst (50 dégâts de jauge) remplace Steel Barrier.",
        "Firestorm est le vrai cœur caché du build : prenez sa spé de niveau 12 dès que possible.",
      ],
      ...common({ pvpSwaps: [{ from: 15160000, to: 15130000, why: "Soul Freeze : gel à 75 % sur une cible." }] }),
    },
  },

  // ===================================================================== SPIRITUALISTE
  {
    title: "Spiritualiste — Maître des éléments (PvE)",
    classId: "spiritmaster",
    mode: "PVE",
    role: "DPS magique / invocateur",
    featured: true,
    tags: ["DoT", "Invocation", "Transcendance"],
    patch: PATCH,
    summary:
      "Esprit Ancien + Jointstrike: Corrode pour empiler les Quatre Éléments et les dégâts sur la durée, Elemental Fusion en zone, Spirit's Benediction pour +20 % de dégâts PvE.",
    data: {
      overview: {
        playstyle:
          "On joue à deux : vous et l'esprit. On garde un DoT (Curse, Corrode) sur chaque cible pour activer Consecutive Countercurrent, on cumule les Quatre Éléments et on les dépense avec Elemental Fusion.",
        strengths: ["Dégâts réguliers et sûrs à distance", "Esprit qui encaisse/soigne", "Très bon en multi-cibles avec les DoT"],
        weaknesses: ["Montée en puissance plus lente", "Esprit à gérer", "Moins de burst instantané"],
        difficulty: 3,
        content: ["Transcendance", "Conquête", "Cauchemar"],
      },
      skills: [
        sk(16140000, 10, 1, [1, 4], "Curse 4 cibles : +2 s de durée puis -2 s de recharge."),
        sk(16300000, 10, 2, [1, 4], "Se déclenche à 4 éléments : en zone (spé 1), puis chargé jusqu'à +200 % (spé 4)."),
        sk(16040000, 10, 3, [2, 4], "Sort principal : bonus mono-cible puis +20 % de vitesse."),
        sk(16010000, 10, 4, [3, 4], "Multi-Hit puis +2 % d'attaque cumulable."),
        sk(16100000, 10, 5, [2, 3], "Esprit de feu offensif : critique et déclenchements."),
        sk(16710000, 10, 6, [], "Spirit Strike : +6 % de dégâts PvE pour vous et l'esprit."),
        sk(16760000, 10, 7, [], "Mental Focus : très monté par les meilleurs (13,5)."),
        sk(16330000, 8, 8, [2], "Dimensional Control : dégâts différés."),
        sk(16110000, 7, 9, [2], "Esprit d'eau : +10 % d'attaque de l'esprit (spé via Daevanion)."),
        sk(16780000, 7, 10, [], "Element Unification (niv. 25)."),
        sk(16800000, 7, 11, [], "Consecutive Countercurrent : dégâts bonus sur cibles sous DoT."),
        sk(16730000, 7, 12, [], ""),
        sk(16740000, 5, 13, [], "Corrode."),
      ],
      stigmas: [
        st(1, 16250000, 10, "Esprit Ancien 30 s : 4 cibles et Quatre Éléments à chaque compétence. 96 % des meilleurs.", []),
        st(2, 16150000, 8, "DoT de zone qui active Consecutive Countercurrent.", [16240000]),
        st(3, 16370000, 6, "50 % de chance de dégâts bonus à chaque coup.", [16220000]),
        st(4, 16190000, 10, "+20 % de dégâts PvE et tolérance : énorme fenêtre de burst.", []),
      ],
      rotation: [
        { title: "Ouverture", steps: [16100000, 16190000, 16250000, 16140000, 16150000, 16300000, 16040000], note: "Esprit invoqué et buffé avant le pull, DoT sur tout le pack." },
        { title: "Cycle", steps: [16140000, 16040000, 16010000, 16330000, 16300000], note: "Rafraîchir Curse, dépenser les Quatre Éléments dès 4 cumuls." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Paire Spirit Strike ; Combustion, Elemental Fusion, Fire Spirit, Spirit's Descent.", skillNodes: [16040000, 16300000, 16100000, 16730000] },
          { board: "Zikel", focus: "Elemental Fusion, Cold Shock, Combustion ; paires Consecutive Countercurrent et Element Unification.", skillNodes: [16300000, 16010000, 16040000, 16800000] },
          { board: "Vaizel", focus: "Jointstrike: Curse +1.", skillNodes: [16140000] },
          { board: "Triniel", focus: "Elemental Fusion vers la spé 16 (25 % de récupérer les éléments).", skillNodes: [16300000] },
          { board: "Azphel", focus: "Attaque, critique." },
        ],
        statPriority: ["Attaque", "Coup critique", "Précision", "PV max"],
      },
      gear: gear({ t86: "Enraged Kromede Jewel", slug86: "enraged-kromede-jewel", t70: "Aulamus Orb", t54: "Rupture Jewel", suffix: "Orb" }),
      manastones: [
        { stat: "Attack", priority: 1 },
        { stat: "Critical Hit", priority: 2 },
        { stat: "Accuracy Bonus", priority: 3 },
        { stat: "Front Attack Damage Boost", priority: 4 },
      ],
      theostone: { name: "Théostone de poison", note: "Un DoT de plus sur la cible pour Consecutive Countercurrent." },
      stats: { primary: ["Might", "Dexterity", "Constitution", "Willpower"], deity: ["Justice [Nezekan]", "Time [Siel]", "Death [Triniel]", "Freedom [Vaizel]"] },
      tips: [
        "Ne laissez jamais l'esprit mort : sans lui, la moitié de vos dégâts disparaît.",
        "Un DoT actif = Consecutive Countercurrent actif : rafraîchissez Curse avant qu'il tombe.",
        "En PvP, Seize Magic (retire 2 buffs) remplace Flame Blessing.",
      ],
      ...common({ pvpSwaps: [{ from: 16370000, to: 16230000, why: "Retire jusqu'à 2 buffs adverses." }] }),
    },
  },

  // ===================================================================== CLERC
  {
    title: "Clerc — Lumière de la team (Soins PvE)",
    classId: "cleric",
    mode: "PVE",
    role: "Soigneur",
    featured: true,
    tags: ["Soins", "Support", "Raid"],
    patch: PATCH,
    summary:
      "Soins courts et efficaces (Healing Light, Radiant Recovery), Light of Protection pour +10,5 % de dégâts et de tolérance au groupe, et Chain of Torment maintenu entre deux soins.",
    data: {
      overview: {
        playstyle:
          "Soigneur pur qui reste utile offensivement : Chain of Torment baisse la tolérance aux dégâts PvE de la cible pour tout le groupe. Light of Protection (bascule, recharge 5 s) est actif en permanence.",
        strengths: ["Seul soigneur pur", "Gros apport de groupe (Light of Protection, Chain of Torment)", "Résurrection en combat"],
        weaknesses: ["Dégâts personnels limités", "Cible prioritaire en PvP", "Dépend du placement du groupe"],
        difficulty: 3,
        content: ["Raid", "Transcendance", "Conquête"],
      },
      skills: [
        sk(17100000, 10, 1, [1, 4], "Soin du membre le plus bas, 6 s : +2 utilisations consécutives puis +2 % de PV rendus."),
        sk(17120000, 10, 2, [1, 3], "Soin de groupe + purge : retire 2 malus, puis -3 s de recharge."),
        sk(17090000, 10, 3, [2, 3], "Soin sur la durée de groupe : +20 % sous 50 % de PV."),
        sk(17070000, 10, 4, [2, 4], "Baisse la tolérance de la cible : +3 s de DoT puis -10 % de tolérance supplémentaire."),
        sk(17740000, 10, 5, [], "Healing Enhancement : bonus de soins."),
        sk(17780000, 10, 6, [], "Earth's Grace : +10,5 % de dégâts critiques."),
        sk(17350000, 10, 7, [1, 4], "Attaque rapide (3 s) : rend du mana, reset sur critique."),
        sk(17010000, 8, 8, [3], ""),
        sk(17040000, 7, 9, [], ""),
        sk(17710000, 7, 10, [], "Warm Benediction : +6 % de PV max."),
        sk(17730000, 7, 11, [], "Nœud pris deux fois sur Nezekan par les meilleurs."),
        sk(17800000, 7, 12, [], "Radiant Benediction : soin de groupe en attaquant."),
        sk(17750000, 5, 13, [], ""),
      ],
      stigmas: [
        st(1, 17410000, 10, "Bascule : +10,5 % de dégâts et de tolérance PvE pour vous et le groupe. 87 % des meilleurs clercs.", [17400000]),
        st(2, 17440000, 8, "Aura de 300 s autour du clerc.", [17290000]),
        st(3, 17400000, 8, "Coup + DoT 10 s, recharge 30 s : vos dégâts entre deux soins.", [17430000]),
        st(4, 17390000, 5, "Résurrection d'un allié en combat à 40 m.", [17420000]),
      ],
      rotation: [
        { title: "Avant le pull", steps: [17410000, 17440000], note: "Light of Protection et Noble Aura actifs en permanence." },
        { title: "Entre les soins", steps: [17070000, 17400000, 17350000, 17010000, 17350000], note: "Chain of Torment toujours sur la cible du tank." },
        { title: "Soins", steps: [17100000, 17120000, 17090000, 17100000], note: "Healing Light en réactif, Light of Regeneration avant les dégâts de zone prévus." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Paires Healing Enhancement et Warm Benediction ; Light of Regeneration, Condemnation, Judgment Thunder, Chain of Torment.", skillNodes: [17090000, 17350000, 17040000, 17070000] },
          { board: "Zikel", focus: "Radiant Benediction, Earth's Retribution, Judgment Thunder.", skillNodes: [17010000, 17040000, 17800000] },
          { board: "Vaizel", focus: "Healing Light +1.", skillNodes: [17100000] },
          { board: "Triniel", focus: "Radiant Recovery puis soins.", skillNodes: [17120000] },
          { board: "Azphel", focus: "Bonus de soins, PV max." },
        ],
        statPriority: ["Bonus de soins", "Attaque", "PV max", "Coup critique"],
      },
      gear: gear({ t86: "Enraged Kromede Warhammer", slug86: "enraged-kromede-warhammer", t70: "Aulamus Mace", t54: "Rupture Warhammer", suffix: "Mace" }),
      manastones: [
        { stat: "Attack", priority: 1, note: "les soins évoluent avec l'attaque" },
        { stat: "HP", priority: 2 },
        { stat: "Critical Hit", priority: 3 },
        { stat: "Defense", priority: 4 },
      ],
      theostone: { name: "Théostone de dégâts (PvE)", note: "Étourdissement ou Sceau en PvP pour se dégager." },
      stats: { primary: ["Might", "Dexterity", "Constitution", "Willpower"], deity: ["Life [Yustiel]", "Time [Siel]", "Justice [Nezekan]", "Death [Triniel]"] },
      tips: [
        "Chain of Torment ne se cumule pas avec Earth's Promise de l'Aède : dans un groupe avec les deux, répartissez les rôles.",
        "Light of Protection ne se cumule pas avec Undefeated Mantra de l'Aède.",
        "En solo, Earth Punishment passe en emplacement 1 ; remettez Light of Protection pour les donjons.",
      ],
      ...common({ pvpSwaps: [{ from: 17440000, to: 17270000, why: "Salvation : immunité 3 s sous focus." }] }),
    },
  },

  // ===================================================================== AÈDE
  {
    title: "Aède — Mantras de guerre (Support DPS)",
    classId: "chanter",
    mode: "PVE",
    role: "Support / DPS",
    featured: true,
    tags: ["Support", "Mantras", "Raid"],
    patch: PATCH,
    summary:
      "Undefeated Mantra et Sprint Mantra en permanence, Power of the Storm pour +20 % de vitesse et -20 % de recharges au groupe, et un vrai DPS autour de Dark Crush et Spinning Strike.",
    data: {
      overview: {
        playstyle:
          "Hybride au bâton. Spinning Strike (+15 % de dégâts critiques cumulables) et Dark Crush portent les dégâts ; les mantras et Power of the Storm font monter tout le groupe. Recuperation soigne le groupe toutes les 15 s.",
        strengths: ["Énorme apport de groupe", "Soins d'appoint", "DPS correct au corps à corps"],
        weaknesses: ["Corps à corps", "Polyvalent mais jamais le meilleur dans un rôle", "Buffs à synchroniser avec le groupe"],
        difficulty: 3,
        content: ["Raid", "Transcendance", "Conquête"],
      },
      skills: [
        sk(18290000, 10, 1, [1, 3], "+15 % de dégâts critiques 30 s (cumul ×2) : -5 s de recharge puis bonus mono-cible."),
        sk(18100000, 10, 2, [3, 4], "Recharge 5 s : critique sur coup, puis chaîne Piercing Strike (niv. 12)."),
        sk(18010000, 10, 3, [3, 4], "Attaque de base ; spé 4 : -1 s sur Spinning Strike."),
        sk(18040000, 10, 4, [1, 3], "-20 % de mana puis bonus mono-cible."),
        sk(18120000, 10, 5, [1, 2], "Soin de groupe 15 s : +1 utilisation puis purge de 2 malus."),
        sk(18750000, 10, 6, [], "Attack Preparation : +5,5 % de dégâts PvE."),
        sk(18800000, 10, 7, [], "Wind's Promise (niv. 25) : le plus monté chez les meilleurs."),
        sk(18090000, 8, 8, [1], "-20 % de résistance aux effets d'impact pour Dark Crush."),
        sk(18060000, 7, 9, [], "Étourdissement qui ouvre Dark Crush."),
        sk(18780000, 7, 10, [], "Earth's Promise : -5,4 % de tolérance de la cible."),
        sk(18730000, 7, 11, [], "Protection Circle : barrière de groupe toutes les 10 frappes."),
        sk(18710000, 7, 12, [], ""),
        sk(18740000, 5, 13, [], ""),
      ],
      stigmas: [
        st(1, 18330000, 8, "4 cibles, 30 s, ouvre une fenêtre de Dark Crush de 3 s : idéal pour monter en niveau.", [18220000]),
        st(2, 18190000, 10, "Bascule : +10,5 % de dégâts et tolérance PvE au groupe. 99 % des meilleurs aèdes.", []),
        st(3, 18250000, 8, "+20 % de vitesse de combat et -20 % de recharges 10 s pour le groupe.", []),
        st(4, 18160000, 5, "Mantra de vitesse + soin sur coup.", [18240000, 18170000]),
      ],
      rotation: [
        { title: "Avant le pull", steps: [18190000, 18160000, 18290000], note: "Mantras activés, première pile de Spinning Strike." },
        { title: "Burst de groupe", steps: [18250000, 18290000, 18330000, 18100000, 18060000, 18100000], note: "Annoncez Power of the Storm : toute la team en profite." },
        { title: "Cycle", steps: [18010000, 18100000, 18040000, 18100000, 18120000], note: "Recuperation dès que le groupe prend des dégâts." },
      ],
      daevanion: {
        boards: [
          { board: "Nezekan", focus: "Paires Attack Preparation et Protection Circle ; Dark Crush, Onslaught, Incandescent Blow.", skillNodes: [18100000, 18010000, 18040000, 18750000] },
          { board: "Zikel", focus: "Dark Crush, Onslaught, Spinning Strike ; paire Earth's Promise.", skillNodes: [18100000, 18010000, 18290000, 18780000] },
          { board: "Vaizel", focus: "Recuperation +1.", skillNodes: [18120000] },
          { board: "Triniel", focus: "Dark Crush vers la spé 16 (supprime sa recharge).", skillNodes: [18100000] },
          { board: "Azphel", focus: "Attaque, critique, PV." },
        ],
        statPriority: ["Attaque", "Coup critique", "Vitesse de combat", "PV max"],
      },
      gear: gear({ t86: "Enraged Kromede Rod", slug86: "enraged-kromede-rod", t70: "Aulamus Staff", t54: "Rupture Rod", suffix: "Staff" }),
      manastones: [
        { stat: "Attack", priority: 1 },
        { stat: "Critical Hit", priority: 2 },
        { stat: "Accuracy Bonus", priority: 3 },
        { stat: "HP", priority: 4 },
      ],
      theostone: { name: "Théostone de zone (AoE)", note: "La plupart de vos coups touchent 4 cibles." },
      stats: { primary: ["Might", "Dexterity", "Constitution", "Willpower"], deity: DEITY_DPS },
      tips: [
        "Undefeated Mantra ne se cumule pas avec Light of Protection du Clerc : si un clerc de la team joue Light of Protection, remplacez le mantra par Impeding Authority (bouclier de groupe).",
        "Synchronisez Power of the Storm avec les buffs des DPS de la team.",
        "Spinning Strike se cumule deux fois : relancez-le avant la fin des 30 s.",
      ],
      ...common({ pvpSwaps: [{ from: 18160000, to: 18240000, why: "Bouclier de 16 % des PV max pour le groupe." }] }),
    },
  },
];
