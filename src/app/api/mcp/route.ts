/**
 * Serveur MCP de la team AION 2 : permet à Claude (ou tout client MCP) de lire les données du
 * client global, de créer/modifier des builds et de suivre la progression des joueurs.
 *
 *   claude mcp add --transport http aion2 https://<site>/api/mcp --header "Authorization: Bearer <MCP_API_KEY>"
 */
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { ACTIVITIES, CONQUEST_TIERS, EXPEDITION_GEAR, NIGHTMARE_LAYERS, STIGMA_SLOT_LEVELS, TRANSCENDENCE } from "@/data/activities";
import { buildDataSchema, buildInputSchema, CLASS_IDS, GEAR_SLOTS, type ClassIdT } from "@/lib/build-schema";
import { allClasses, CLASS_INFO, DUNGEONS, GAME_META, getClass, searchItems } from "@/lib/game-data";
import { safeEqual } from "@/lib/session";
import {
  BuildValidationError,
  createBuild,
  createPlayer,
  deleteBuild,
  getBuild,
  getPlayer,
  getPlayerRecommendations,
  getTeamOverview,
  incrementActivity,
  listBuilds,
  listPlayers,
  setActivityCount,
  skillPointCost,
  updateBuild,
  updateProgress,
  validateBuildData,
} from "@/lib/services";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] });
const fail = (e: unknown) => ({
  isError: true,
  content: [
    {
      type: "text" as const,
      text:
        e instanceof BuildValidationError
          ? e.message
          : e instanceof z.ZodError
            ? "Entrée invalide :\n" + e.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n")
            : e instanceof Error
              ? e.message
              : String(e),
    },
  ],
});
const safe =
  <A,>(fn: (args: A) => Promise<unknown> | unknown) =>
  async (args: A) => {
    try {
      return json(await fn(args));
    } catch (e) {
      return fail(e);
    }
  };

async function requirePlayer(idOrName: string) {
  const p = await getPlayer(idOrName);
  if (!p) throw new Error(`Joueur introuvable : ${idOrName}. Utilise list_players.`);
  return p;
}

const classIdSchema = z.enum(CLASS_IDS);

const INSTRUCTIONS = `Serveur de la team WARLORD sur AION 2 (version GLOBALE / occidentale, pas coréenne).
Données de jeu lues depuis le client global (${GAME_META.source}, synchro ${GAME_META.syncedAt.slice(0, 10)}).
Pour créer un build : 1) get_class_data pour récupérer les IDs exacts des compétences, spécialisations et stigmas
ainsi que les statistiques des meilleurs joueurs ; 2) search_items pour l'équipement ; 3) create_build.
Un build doit être très détaillé : compétences prioritaires avec niveau visé et 1-3 spécialisations, 4 stigmas
(emplacements 22/27/32/37) avec alternatives, plateaux Daevanion, équipement par emplacement avec source et
enchantement, pierres de mana, théostone, arcanes, stats, rotations (ouverture, mono-cible, multi-cibles), conseils.
Les textes du build sont en français ; les noms de compétences/objets restent ceux du client (anglais).`;

const handler = createMcpHandler(
  (server) => {
    // ---------------------------------------------------------------- données de jeu
    server.registerTool(
      "list_classes",
      {
        title: "Lister les classes",
        description: "Les 8 classes d'AION 2 (global) avec rôle, arme, et statistiques des meilleurs joueurs.",
        inputSchema: z.object({}),
      },
      safe(() =>
        allClasses().map((c) => ({
          id: c.id,
          name: c.name,
          nameFr: CLASS_INFO[c.id].fr,
          role: CLASS_INFO[c.id].role,
          weapon: CLASS_INFO[c.id].weapon,
          medianCombatPower: c.meta.medianCombatPower,
          top10CombatPower: c.meta.top10CombatPower,
          avgItemLevel: c.meta.avgItemLevel,
        })),
      ),
    );

    server.registerTool(
      "get_class_data",
      {
        title: "Données détaillées d'une classe",
        description:
          "Compétences actives/passives, stigmas, spécialisations (avec IDs à utiliser dans les builds) et méta des meilleurs joueurs (taux de choix, équipement par emplacement, enchantements, pierres de mana, arcanes, stats, nœuds Daevanion).",
        inputSchema: z.object({
          classId: classIdSchema,
          sections: z
            .array(z.enum(["skills", "stigmas", "specializations", "meta", "points"]))
            .optional()
            .describe("Sections à renvoyer (toutes par défaut)"),
        }),
      },
      safe(({ classId, sections }: { classId: ClassIdT; sections?: string[] }) => {
        const c = getClass(classId);
        const want = (s: string) => !sections || sections.includes(s);
        return {
          id: c.id,
          name: c.name,
          info: CLASS_INFO[c.id],
          rules: {
            stigmaSlotLevels: STIGMA_SLOT_LEVELS,
            skillPointCost: "Niv. 2-4 : 1 pt/niv, 5-7 : 2, 8-10 : 4 (21 pts pour 1→10). 203 points au niveau 45.",
            specializationSlots: "3 emplacements, ouverts aux niveaux de compétence 8, 12 et 20 ; options disponibles à 8 (x3), 12 et 16.",
            daevanion: "+4 niveaux max par compétence via les nœuds ronds. Plateaux : Nezekan 12, Zikel 20, Vaizel 30, Triniel 40, Azphel 45.",
          },
          skills: want("skills")
            ? c.skills.map((s) => ({ id: s.id, name: s.name, type: s.type, unlock: s.unlockLevel, cd: s.cooldown, effect: s.effect, topPick: s.meta && `${s.meta.pickRate}% · niv. moy. ${s.meta.avgLevel}` }))
            : undefined,
          stigmas: want("stigmas")
            ? c.stigmas.map((s) => ({ id: s.id, name: s.name, cd: s.cooldown, effect: s.effect, topPick: s.meta && `${s.meta.pickRate}% · niv. moy. ${s.meta.avgLevel}` }))
            : undefined,
          specializations: want("specializations")
            ? c.specializations.map((s) => ({ id: s.id, skillId: s.skillId, skill: s.skillName, level: s.requiredSkillLevel, effect: s.effect }))
            : undefined,
          topPlayersMeta: want("meta") ? c.meta : undefined,
          pointsTable: want("points") ? c.pointsTable : undefined,
        };
      }),
    );

    server.registerTool(
      "search_items",
      {
        title: "Chercher un objet",
        description: "Recherche dans le catalogue local (armes, armures, accessoires, arcanes du client global) avec slug, grade, item level, stats et source.",
        inputSchema: z.object({
          query: z.string().describe("Texte du nom (vide = tout)"),
          category: z.string().optional().describe("Ex : Greatsword, Guard, Helm, Ring, Arcana…"),
          group: z.enum(["weapons", "armor", "accessories", "arcana"]).optional(),
          minItemLevel: z.number().optional(),
          limit: z.number().int().max(100).optional(),
        }),
      },
      safe((args: { query: string; category?: string; group?: string; minItemLevel?: number; limit?: number }) => searchItems(args.query, args)),
    );

    server.registerTool(
      "get_game_reference",
      {
        title: "Référence endgame",
        description: "Activités récurrentes (plafonds, resets), paliers d'item level (Conquête, Transcendance), échelle d'équipement, Cauchemar, donjons.",
        inputSchema: z.object({ includeDungeons: z.boolean().optional() }),
      },
      safe(({ includeDungeons }: { includeDungeons?: boolean }) => ({
        activities: ACTIVITIES,
        conquestTiers: CONQUEST_TIERS,
        transcendence: TRANSCENDENCE,
        expeditionGear: EXPEDITION_GEAR,
        nightmare: NIGHTMARE_LAYERS,
        gearSlots: GEAR_SLOTS,
        dungeons: includeDungeons ? DUNGEONS.filter((d) => d.type !== "Sealed Dungeon") : undefined,
      })),
    );

    // ---------------------------------------------------------------- builds
    server.registerTool(
      "list_builds",
      {
        title: "Lister les builds",
        description: "Builds enregistrés sur le site de la team.",
        inputSchema: z.object({ classId: classIdSchema.optional(), mode: z.enum(["PVE", "PVP", "HYBRID"]).optional() }),
      },
      safe(async (f: { classId?: ClassIdT; mode?: "PVE" | "PVP" | "HYBRID" }) =>
        (await listBuilds(f)).map((b) => ({ id: b.id, slug: b.slug, title: b.title, classId: b.classId, mode: b.mode, role: b.role, summary: b.summary, updatedAt: b.updatedAt })),
      ),
    );

    server.registerTool(
      "get_build",
      {
        title: "Lire un build",
        description: "Contenu complet d'un build (par id ou slug).",
        inputSchema: z.object({ build: z.string() }),
      },
      safe(async ({ build }: { build: string }) => {
        const b = await getBuild(build);
        if (!b) throw new Error("Build introuvable");
        return b;
      }),
    );

    server.registerTool(
      "validate_build",
      {
        title: "Valider un build",
        description: "Vérifie un build sans l'enregistrer : IDs de compétences/spécialisations/stigmas, objets connus, budget de points.",
        inputSchema: z.object({ classId: classIdSchema, data: buildDataSchema }),
      },
      safe(({ classId, data }: { classId: ClassIdT; data: z.infer<typeof buildDataSchema> }) => ({
        ...validateBuildData(classId, data),
        skillPointsUsed: skillPointCost(data),
      })),
    );

    server.registerTool(
      "create_build",
      {
        title: "Créer un build",
        description: "Crée un build détaillé. Les IDs sont validés contre les données du client global de la classe.",
        inputSchema: buildInputSchema,
      },
      safe(async (input: unknown) => {
        const { build, warnings } = await createBuild(input);
        return { created: { id: build.id, slug: build.slug, url: `/builds/${build.slug}` }, warnings };
      }),
    );

    server.registerTool(
      "update_build",
      {
        title: "Modifier un build",
        description: "Met à jour un build existant (champs fournis uniquement ; `data` remplace entièrement le contenu).",
        inputSchema: z.object({ build: z.string().describe("id ou slug"), patch: buildInputSchema.partial() }),
      },
      safe(async ({ build, patch }: { build: string; patch: unknown }) => {
        const r = await updateBuild(build, patch);
        return { updated: { id: r.build.id, slug: r.build.slug }, warnings: r.warnings };
      }),
    );

    server.registerTool(
      "delete_build",
      {
        title: "Supprimer un build",
        description: "Supprime définitivement un build.",
        inputSchema: z.object({ build: z.string() }),
      },
      safe(async ({ build }: { build: string }) => {
        await deleteBuild(build);
        return { deleted: build };
      }),
    );

    // ---------------------------------------------------------------- joueurs & progression
    server.registerTool(
      "list_players",
      {
        title: "Lister la team",
        description: "Joueurs de la team avec leur classe, niveau, item level, puissance et build suivi.",
        inputSchema: z.object({}),
      },
      safe(async () =>
        (await listPlayers()).map((p) => ({
          id: p.id,
          name: p.name,
          classId: p.classId,
          faction: p.faction,
          level: p.progress?.level,
          itemLevel: p.progress?.itemLevel,
          combatPower: p.progress?.combatPower,
          build: p.progress?.build ? { slug: p.progress.build.slug, title: p.progress.build.title } : null,
        })),
      ),
    );

    server.registerTool(
      "create_player",
      {
        title: "Ajouter un joueur",
        description: "Ajoute un membre à la team.",
        inputSchema: z.object({
          name: z.string().min(2),
          classId: classIdSchema,
          faction: z.enum(["ELYOS", "ASMODIAN"]).optional(),
          server: z.string().optional(),
        }),
      },
      safe((input: { name: string; classId: ClassIdT; faction?: "ELYOS" | "ASMODIAN"; server?: string }) => createPlayer(input)),
    );

    server.registerTool(
      "get_player_progress",
      {
        title: "Progression d'un joueur",
        description: "État détaillé d'un joueur, compteurs du jour/de la semaine et recommandations ordonnées de ce qu'il doit faire.",
        inputSchema: z.object({ player: z.string().describe("id ou nom") }),
      },
      safe(async ({ player }: { player: string }) => {
        const p = await requirePlayer(player);
        const r = await getPlayerRecommendations(p.id);
        return {
          player: { id: p.id, name: p.name, classId: p.classId, build: p.progress?.build?.slug ?? null },
          progress: r.progress,
          counts: r.counts,
          recommendations: r.recommendations,
        };
      }),
    );

    server.registerTool(
      "update_player_progress",
      {
        title: "Mettre à jour la progression",
        description:
          "Met à jour niveau, item level, puissance, quêtes d'Ascension, Daevanion ({nezekan: points…}), Transcendance ({slug: palier}), équipement ({MainHand: {name,itemLevel,enchant,grade}}), niveaux de compétences ({skillId: niveau}), stigmas ({stigmaId: niveau}) ou build suivi. Les objets JSON sont fusionnés (null supprime une clé).",
        inputSchema: z.object({
          player: z.string(),
          level: z.number().int().optional(),
          itemLevel: z.number().int().optional(),
          combatPower: z.number().int().optional(),
          ascensionStep: z.number().int().min(0).max(5).optional(),
          daevanion: z.record(z.string(), z.number().nullable()).optional(),
          transcendence: z.record(z.string(), z.number().nullable()).optional(),
          nightmare: z.object({ layer: z.number().int().optional() }).optional(),
          gear: z
            .partialRecord(
              z.enum(GEAR_SLOTS),
              z.object({ name: z.string().optional(), itemLevel: z.number().optional(), enchant: z.number().optional(), grade: z.string().optional() }).nullable(),
            )
            .optional(),
          skillLevels: z.record(z.string(), z.number().nullable()).optional(),
          stigmas: z.record(z.string(), z.number().nullable()).optional(),
          clears: z.record(z.string(), z.boolean().nullable()).optional(),
          buildSlug: z.string().nullable().optional().describe("Build suivi (slug), null pour aucun"),
          notes: z.string().optional(),
        }),
      },
      safe(async ({ player, buildSlug, ...patch }: { player: string; buildSlug?: string | null } & Record<string, unknown>) => {
        const p = await requirePlayer(player);
        let buildId: string | null | undefined = undefined;
        if (buildSlug !== undefined) buildId = buildSlug ? ((await getBuild(buildSlug))?.id ?? null) : null;
        const updated = await updateProgress(p.id, { ...(patch as object), buildId });
        return { ok: true, level: updated.level, itemLevel: updated.itemLevel, build: updated.build?.slug ?? null };
      }),
    );

    server.registerTool(
      "log_activity",
      {
        title: "Cocher une activité",
        description: `Enregistre des passages sur une activité quotidienne/hebdo pour la période en cours. Clés : ${ACTIVITIES.map((a) => a.key).join(", ")}.`,
        inputSchema: z.object({
          player: z.string(),
          activityKey: z.string(),
          count: z.number().int().optional().describe("Valeur absolue"),
          delta: z.number().int().optional().describe("Ajout relatif (défaut +1)"),
        }),
      },
      safe(async ({ player, activityKey, count, delta }: { player: string; activityKey: string; count?: number; delta?: number }) => {
        const p = await requirePlayer(player);
        const log = count != null ? await setActivityCount(p.id, activityKey, count) : await incrementActivity(p.id, activityKey, delta ?? 1);
        return { activityKey, periodKey: log.periodKey, count: log.count };
      }),
    );

    server.registerTool(
      "get_team_overview",
      {
        title: "État des lieux de la team",
        description: "Résumé de toute la team : niveaux, item levels, avancement des quotidiennes/hebdos, prochaine action de chacun et suggestions de groupe.",
        inputSchema: z.object({}),
      },
      safe(async () => {
        const { rows, team } = await getTeamOverview();
        return {
          players: rows.map((r) => ({
            name: r.player.name,
            classId: r.player.classId,
            level: r.progress.level,
            itemLevel: r.progress.itemLevel,
            combatPower: r.progress.combatPower,
            daily: r.dailyRatio,
            weekly: r.weeklyRatio,
            next: r.recommendations.filter((x) => !x.done).slice(0, 5).map((x) => x.title),
          })),
          groupSuggestions: team,
        };
      }),
    );
  },
  {
    serverInfo: { name: "warlord-aion2", version: "1.0.0" },
    instructions: INSTRUCTIONS,
  },
);

/**
 * Authentification par clé partagée : en-tête `Authorization: Bearer <clé>` ou paramètre `?key=<clé>`
 * (pour les clients qui ne permettent pas d'ajouter un en-tête, comme les connecteurs claude.ai).
 * Volontairement sans découverte OAuth : un 401 « OAuth » pousse les clients à chercher un serveur
 * d'autorisation qui n'existe pas, et la connexion échoue.
 */
const authError = (status: number, message: string) =>
  Response.json({ jsonrpc: "2.0", id: null, error: { code: -32001, message } }, { status });

async function authed(req: Request) {
  // Clés acceptées : MCP_API_KEY si définie, sinon/et AUTH_SECRET (une seule variable à gérer sur Vercel).
  // On tolère les espaces et guillemets collés par erreur dans les variables.
  const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "") || undefined;
  const accepted = [clean(process.env.MCP_API_KEY), clean(process.env.AUTH_SECRET)].filter((k): k is string => !!k);
  if (!accepted.length) return authError(500, "Ni MCP_API_KEY ni AUTH_SECRET ne sont configurés sur le serveur.");
  const header = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const query = new URL(req.url).searchParams.get("key")?.trim();
  const token = header ?? query;
  if (!token) return authError(401, "Clé MCP manquante : en-tête Authorization: Bearer <clé> ou ?key=<clé>.");
  if (!accepted.some((k) => safeEqual(token, k))) return authError(401, "Clé MCP invalide.");
  return handler(req);
}

export { authed as GET, authed as POST, authed as DELETE };
