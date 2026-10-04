/**
 * Moteur de recommandations : à partir de l'état d'un joueur (niveau, item level, équipement,
 * build suivi, compteurs du jour/de la semaine), produit la liste ordonnée des choses à faire.
 * Fonction pure : utilisée par les pages ET par le serveur MCP.
 */
import {
  ACTIVITIES,
  ASCENSION_QUESTS,
  CONQUEST_TIERS,
  DAEVANION_BOARD_LEVELS,
  EXPEDITION_GEAR,
  STIGMA_SLOT_LEVELS,
  TRANSCENDENCE,
} from "@/data/activities";
import { GEAR_SLOT_LABELS, type BuildData, type GearSlot } from "@/lib/build-schema";
import { DUNGEONS, getItem, getSkill, getSpec } from "@/lib/game-data";

export type GearState = Partial<Record<GearSlot, { name?: string; itemLevel?: number; enchant?: number; grade?: string }>>;

export type ProgressState = {
  level: number;
  itemLevel: number;
  combatPower: number;
  ascensionStep: number;
  daevanion: Record<string, number>;
  transcendence: Record<string, number>;
  nightmare: { layer?: number };
  gear: GearState;
  skillLevels: Record<string, number>;
  stigmas: Record<string, number>;
  clears: Record<string, boolean>;
};

export type Recommendation = {
  id: string;
  category: "progression" | "quotidien" | "hebdo" | "equipement" | "build" | "groupe";
  priority: number; // 0-100
  title: string;
  detail: string;
  icon?: string | null;
  href?: string;
  done?: boolean;
};

export function normalizeProgress(p: Partial<Record<keyof ProgressState, unknown>> | null | undefined): ProgressState {
  const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, never>) : {});
  return {
    level: Number(p?.level ?? 1),
    itemLevel: Number(p?.itemLevel ?? 0),
    combatPower: Number(p?.combatPower ?? 0),
    ascensionStep: Number(p?.ascensionStep ?? 0),
    daevanion: obj(p?.daevanion),
    transcendence: obj(p?.transcendence),
    nightmare: obj(p?.nightmare),
    gear: obj(p?.gear),
    skillLevels: obj(p?.skillLevels),
    stigmas: obj(p?.stigmas),
    clears: obj(p?.clears),
  };
}

const fmt = (n: number) => n.toLocaleString("fr-FR");

export function getRecommendations(
  p: ProgressState,
  opts: { build?: BuildData | null; counts?: Record<string, number> } = {},
): Recommendation[] {
  const recs: Recommendation[] = [];
  const counts = opts.counts ?? {};
  const build = opts.build;
  const atCap = p.level >= 45;

  // ------------------------------------------------------------ montée en niveau
  if (!atCap) {
    const band = DUNGEONS.filter((d) => d.type === "Sealed Dungeon" && d.level && d.level <= p.level && d.level >= p.level - 5)
      .slice(0, 6)
      .map((d) => d.name);
    recs.push({
      id: "leveling",
      category: "progression",
      priority: 95,
      title: `Monter niveau ${p.level} → 45`,
      detail:
        `Suivre la quête principale (Episode) + les quêtes régionales : elles couvrent l'essentiel de l'XP. ` +
        (band.length ? `Donjons scellés à ton niveau : ${band.join(", ")}. ` : "") +
        `Les niveaux 40 → 44 représentent ~70 % de l'XP totale : garde tes quêtes régionales pour cette fin.`,
      href: "/activites",
    });
    if (p.level >= 30)
      recs.push({
        id: "unknown-fissure",
        category: "progression",
        priority: 50,
        title: "Fissure inconnue (donjon quotidien, niv. 30+)",
        detail: "14 entrées par semaine : XP et matériaux pendant la montée.",
      });
    const gearHint =
      p.level < 20
        ? "Garde l'équipement de quête, n'utilise pas de pierres d'enchantement au-delà des niveaux gratuits."
        : p.level < 30
          ? "Passe en équipement Épique (IL 23 au niv. 20, IL 28 au niv. 25) via quêtes et élites de zone. Exploration de Krao Cave : set Épique IL 25."
          : p.level < 40
            ? "Premières pièces Uniques : IL 36 (niv. 30) puis IL 41 (niv. 35) sur les monstres nommés de niveau 45 d'Altgard/Verteron. Fire Temple Exploration : set Kromede IL 43."
            : "Sets IL 46 sur les élites nommés (High Commander Lagta, Silent Dartan, Soul Ruler Kashapa) ou Fallen Ancient God dans les Abysses.";
    recs.push({ id: "leveling-gear", category: "equipement", priority: 60, title: "Équipement de leveling", detail: gearHint });
  }

  // ------------------------------------------------------------ ascension
  const nextAsc = ASCENSION_QUESTS.find((q) => q.step > p.ascensionStep);
  if (nextAsc && p.level >= nextAsc.level - 1) {
    recs.push({
      id: "ascension",
      category: "progression",
      priority: atCap ? 99 : 80,
      title: `Quête d'Ascension ${nextAsc.step}/5 : ${nextAsc.name}`,
      detail: "Chaque étape donne un objet d'Ascension qui renforce ton Daeva. À finir avant de viser l'équipement endgame.",
    });
  }

  // ------------------------------------------------------------ build : stigmas & compétences
  if (build) {
    const unlockedSlots = STIGMA_SLOT_LEVELS.filter((l) => p.level >= l).length;
    for (const st of build.stigmas.filter((s) => s.slot <= unlockedSlots)) {
      const skill = getSkill(st.stigmaId);
      const cur = Number(p.stigmas[String(st.stigmaId)] ?? 0);
      if (!skill) continue;
      if (cur === 0)
        recs.push({
          id: `stigma-${st.stigmaId}`,
          category: "build",
          priority: 85,
          title: `Équiper le stigma ${skill.name} (emplacement ${st.slot})`,
          detail: st.note ?? `Prévu par ton build pour l'emplacement débloqué au niveau ${STIGMA_SLOT_LEVELS[st.slot - 1]}.`,
          icon: skill.icon,
        });
      else if (cur < Math.min(st.targetLevel, 5))
        recs.push({
          id: `stigma-lvl-${st.stigmaId}`,
          category: "build",
          priority: 55,
          title: `Monter ${skill.name} au niveau 5 (actuel ${cur})`,
          detail: "Le niveau 5 débloque la première spécialisation du stigma. Les Fragments de Stigma se farment en donjon.",
          icon: skill.icon,
        });
    }
    const sorted = [...build.skills].sort((a, b) => a.priority - b.priority);
    const missing = sorted.filter((s) => {
      const sk = getSkill(s.skillId);
      return sk && (sk.unlockLevel ?? 1) <= p.level && Number(p.skillLevels[String(s.skillId)] ?? 1) < s.targetLevel;
    });
    if (missing.length && Object.keys(p.skillLevels).length) {
      const next = missing[0];
      const sk = getSkill(next.skillId)!;
      recs.push({
        id: `skill-${next.skillId}`,
        category: "build",
        priority: 65,
        title: `Points de compétence → ${sk.name} niv. ${next.targetLevel}`,
        detail:
          `Priorité n°${next.priority} de ton build (actuel : niv. ${p.skillLevels[String(next.skillId)] ?? 1}).` +
          (next.specializations.length
            ? ` Spécialisations : ${next.specializations.map((id) => getSpec(id)?.effect ?? id).join(" · ")}.`
            : ""),
        icon: sk.icon,
      });
    }
  }

  // ------------------------------------------------------------ Daevanion
  for (const [board, info] of Object.entries(DAEVANION_BOARD_LEVELS)) {
    if (p.level < info.level) continue;
    const spent = Number(p.daevanion[board.toLowerCase()] ?? 0);
    if (spent === 0) {
      const focus = build?.daevanion.boards.find((b) => b.board === board)?.focus;
      recs.push({
        id: `daevanion-${board}`,
        category: "build",
        priority: board === "Nezekan" ? 70 : 50,
        title: `Commencer le plateau Daevanion ${board}`,
        detail: focus ?? `Débloqué au niveau ${info.level} (${info.points} points pour le compléter).`,
      });
      break;
    }
  }

  if (!atCap) return finalize(recs);

  // ------------------------------------------------------------ paliers d'item level
  const nextConquest = CONQUEST_TIERS.find((t) => p.itemLevel < t.itemLevel);
  const currentConquest = [...CONQUEST_TIERS].reverse().find((t) => p.itemLevel >= t.itemLevel);
  if (nextConquest)
    recs.push({
      id: "conquest-tier",
      category: "progression",
      priority: 75,
      title: `Viser Conquête palier ${nextConquest.tier} : IL ${fmt(nextConquest.itemLevel)}`,
      detail: `Il te manque ${fmt(nextConquest.itemLevel - p.itemLevel)} d'item level. ${currentConquest ? `Palier ${currentConquest.tier} déjà accessible.` : "Commence par l'Exploration (mode Facile) des Expéditions."}`,
    });

  const trStage1 = TRANSCENDENCE[0].stages[0];
  if (p.itemLevel < trStage1) {
    recs.push({
      id: "transcendence-gate",
      category: "progression",
      priority: 88,
      title: `Débloquer la Transcendance : IL ${fmt(trStage1)}`,
      detail: `Encore ${fmt(trStage1 - p.itemLevel)} d'item level. Les Arcanes comptent dans l'item level total : chaque carte aide à passer le seuil.`,
    });
  } else {
    for (const d of TRANSCENDENCE) {
      const best = Number(p.transcendence[d.slug] ?? 0);
      const nextStage = best + 1;
      const gate = d.stages[nextStage - 1];
      if (!gate) continue;
      if (p.itemLevel >= gate) {
        recs.push({
          id: `transcendence-${d.slug}`,
          category: "progression",
          priority: 80,
          title: `${d.name} : tenter le palier ${nextStage}`,
          detail: `Tu as l'item level requis (${fmt(gate)}). Paliers plus hauts = Arcanes de meilleure qualité. Saison : ${d.seasons}.`,
          href: "/activites",
        });
      } else if (gate - p.itemLevel <= 300) {
        recs.push({
          id: `transcendence-next-${d.slug}`,
          category: "progression",
          priority: 45,
          title: `${d.name} palier ${nextStage} à portée`,
          detail: `Encore ${fmt(gate - p.itemLevel)} d'item level (seuil ${fmt(gate)}).`,
        });
      }
    }
  }

  if (p.itemLevel >= 1000 && !p.clears["latesran"])
    recs.push({
      id: "abyss-latesran",
      category: "progression",
      priority: 40,
      title: "Abysses : Latesran Western Root accessible (IL 1 000)",
      detail: "Zone de Lower Reshanta réservée aux IL 1 000+ : Points Abyssaux et élites du set Kaira.",
    });

  // ------------------------------------------------------------ échelle d'équipement
  const gearEntries = Object.entries(p.gear).filter(([, g]) => g && g.itemLevel);
  const avgGear = gearEntries.length ? gearEntries.reduce((s, [, g]) => s + (g!.itemLevel ?? 0), 0) / gearEntries.length : null;
  const tier = EXPEDITION_GEAR.find((t) => (avgGear ?? estimateGearIl(p.itemLevel)) < t.itemLevel) ?? EXPEDITION_GEAR.at(-1)!;
  recs.push({
    id: `gear-tier-${tier.itemLevel}`,
    category: "equipement",
    priority: 78,
    title: `Farmer l'équipement Unique IL ${tier.itemLevel} : ${tier.dungeons.join(" / ")}`,
    detail:
      `${avgGear ? `IL moyen de tes pièces : ${Math.round(avgGear)}. ` : ""}Boss : ${tier.boss}. ` +
      "Garde tes Gear Change Vouchers : convertis en Substance Morph, ils garantissent une garde ou un coffre d'armure.",
    href: "/activites",
  });

  // pièces du build manquantes / sous-enchantées
  if (build) {
    for (const g of build.gear) {
      const mine = p.gear[g.slot];
      const target = getItem(g.itemSlug ?? g.name);
      if (!mine?.name || mine.name.toLowerCase() !== g.name.toLowerCase()) {
        if (target?.itemLevel && mine?.itemLevel && mine.itemLevel >= target.itemLevel) continue;
        recs.push({
          id: `gear-${g.slot}`,
          category: "equipement",
          priority: g.slot === "MainHand" ? 72 : 52,
          title: `${GEAR_SLOT_LABELS[g.slot]} : obtenir ${g.name}`,
          detail: [g.source && `Source : ${g.source}.`, mine?.name && `Actuel : ${mine.name}.`, g.note].filter(Boolean).join(" "),
          icon: target?.icon,
        });
      } else if (g.enchant && (mine.enchant ?? 0) < g.enchant) {
        recs.push({
          id: `enchant-${g.slot}`,
          category: "equipement",
          priority: g.slot === "MainHand" ? 68 : 42,
          title: `${GEAR_SLOT_LABELS[g.slot]} : enchanter ${g.name} à +${g.enchant}`,
          detail: `Actuellement +${mine.enchant ?? 0}. L'enchantement est conservé lors des améliorations de craft.`,
          icon: target?.icon,
        });
      }
    }
  }

  // ------------------------------------------------------------ activités récurrentes
  for (const a of ACTIVITIES) {
    if (p.level < a.minLevel) continue;
    if (a.minItemLevel && p.itemLevel < a.minItemLevel) continue;
    const done = Number(counts[a.key] ?? 0);
    const remaining = a.target - done;
    recs.push({
      id: `act-${a.key}`,
      category: a.reset === "daily" ? "quotidien" : "hebdo",
      priority: remaining > 0 ? a.weight * 0.9 : 5,
      title: remaining > 0 ? `${a.label} — ${done}/${a.target}` : `${a.label} — terminé`,
      detail: a.tip ?? a.rewards,
      icon: a.icon,
      done: remaining <= 0,
      href: "/activites",
    });
  }

  return finalize(recs);
}

/** Estimation grossière de l'IL moyen d'une pièce depuis l'IL total (≈ 20 emplacements + arcanes) */
function estimateGearIl(total: number) {
  return total / 21;
}

function finalize(recs: Recommendation[]) {
  return recs.sort((a, b) => Number(!!a.done) - Number(!!b.done) || b.priority - a.priority);
}

/** Recommandations de groupe à partir de toute la team */
export function getTeamRecommendations(players: { name: string; progress: ProgressState }[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const capped = players.filter((p) => p.progress.level >= 45);
  if (!players.length) return recs;
  const minIl = capped.length ? Math.min(...capped.map((p) => p.progress.itemLevel)) : 0;

  if (capped.length < players.length) {
    const lv = players.filter((p) => p.progress.level < 45).map((p) => `${p.name} (${p.progress.level})`);
    recs.push({
      id: "team-leveling",
      category: "groupe",
      priority: 70,
      title: "Aider les membres encore en leveling",
      detail: `${lv.join(", ")} ${lv.length > 1 ? "ne sont pas encore" : "n'est pas encore"} niveau 45. Les donjons scellés et l'Exploration de Krao Cave se font très bien à plusieurs.`,
    });
  }
  if (capped.length >= 2) {
    const tier = EXPEDITION_GEAR.find((t) => estimateGearIl(minIl) < t.itemLevel) ?? EXPEDITION_GEAR.at(-1)!;
    recs.push({
      id: "team-expedition",
      category: "groupe",
      priority: 80,
      title: `Sortie de groupe : ${tier.dungeons.join(" / ")}`,
      detail: `${capped.length} membres niveau 45. Item level le plus bas : ${fmt(minIl)}. Groupe de 5 = la team au complet.`,
    });
  }
  const trEligible = capped.filter((p) => p.progress.itemLevel >= 1600);
  if (trEligible.length >= 2)
    recs.push({
      id: "team-transcendence",
      category: "groupe",
      priority: 85,
      title: `Transcendance en groupe (${trEligible.length} éligibles)`,
      detail: `${trEligible.map((p) => p.name).join(", ")} ont IL ≥ 1 600 : Deus Research Base / Shattered Arkanis à 2-5 joueurs.`,
    });
  if (capped.length >= 3)
    recs.push({
      id: "team-raid",
      category: "groupe",
      priority: 75,
      title: "Raid hebdo : Abyssal Forge – Ludra (10 joueurs)",
      detail: `La team fournit ${capped.length} joueurs ; complétez avec ${10 - capped.length} joueurs de légion ou en recherche de groupe. Armes IL 102.`,
    });
  return recs.sort((a, b) => b.priority - a.priority);
}
