# Team AION 2

Site privé de la team (5 joueurs) sur **AION 2 — serveur global** :

- **Builds** très détaillés par classe, avec les vraies icônes du jeu : compétences et ordre des points, spécialisations, 4 stigmas + alternatives, rotations, plateaux Daevanion, équipement par emplacement (source + enchantement), pierres de mana, théostone, arcanes, stats, ajustements PvP.
- **Classes** : les 35 compétences et 60 spécialisations de chaque classe, et la méta des meilleurs joueurs du serveur global (équipement porté, enchantements, stats, nœuds Daevanion).
- **État des lieux** de chaque joueur (niveau, item level, puissance, équipement, compétences, stigmas, Daevanion, Transcendance) avec historique.
- **Recommandations** : le site calcule ce que chacun doit faire ensuite (déblocages, paliers d'item level, pièces manquantes du build, quotidiennes/hebdos) et propose des activités de groupe.
- **Checklist** quotidienne / hebdomadaire de toute la team (reset le mercredi).
- **Serveur MCP** (`/api/mcp`) pour que Claude crée et mette à jour les builds et la progression.

**Accès** : les pages **Builds** et **Classes** sont publiques (lecture seule, partageables). Le tableau de bord,
la progression, les activités et l'équipe demandent le mot de passe de la team.

Stack : Next.js 16 (App Router) · shadcn/ui (composants officiels via le CLI, `Sidebar`, `HoverCard`…) · Tailwind 4 · Prisma 7 · PostgreSQL · mcp-handler.

## Données de jeu

Les données (compétences, spécialisations, stigmas, objets, donjons, méta des meilleurs joueurs) sont lues sur
[metabot.gg](https://metabot.gg/en/aion-2), qui extrait directement le **client global**. Elles sont stockées dans
`src/data/game/*.json` et les icônes dans `public/game/` (aucun lien vers un site tiers à l'exécution).

```bash
npm run data:sync            # met à jour après un patch (utilise le cache .cache/)
npm run data:sync -- --fresh # force le re-téléchargement
```

Pour ajouter un objet absent du catalogue : mettre son slug metabot dans `scripts/extra-items.txt`, puis relancer la synchro.
Icônes et noms © NCSOFT — usage privé, non commercial.

## Développement local

```bash
npm install
npx prisma dev --name aion2 --detach   # Postgres local, affiche l'URL à mettre dans DATABASE_URL
cp .env.example .env                    # puis remplir les valeurs
npx prisma migrate dev
npm run dev
npm run db:seed                         # crée les 8 builds de départ via le MCP (site lancé)
```

## Déploiement sur Vercel

1. Pousser ce dossier sur un dépôt GitHub, puis l'importer dans Vercel.
2. Dans le projet Vercel → **Storage** → ajouter **Prisma Postgres** (ou Neon) : `DATABASE_URL` est créée automatiquement.
3. **Settings → Environment Variables** :
   | Variable | Valeur |
   |---|---|
   | `TEAM_PASSWORD` | le mot de passe partagé de la team |
   | `AUTH_SECRET` | `openssl rand -hex 32` |
   | `MCP_API_KEY` | `openssl rand -hex 24` |
   | `NEXT_PUBLIC_RESET_HOUR` / `NEXT_PUBLIC_RESET_TZ` | heure du reset de votre serveur (ex. `6` / `Europe/Paris`) |
4. Déployer : le build lance `prisma migrate deploy` (création des tables).
5. Créer les builds de départ en production :
   ```bash
   MCP_API_KEY=<clé de prod> npm run db:seed -- https://votre-site.vercel.app
   ```
6. Se connecter, aller dans **Équipe** et ajouter les 5 joueurs ; chacun choisit ensuite son perso via « Je suis ».

## Brancher Claude sur le MCP

Claude Code :

```bash
claude mcp add --transport http aion2 https://votre-site.vercel.app/api/mcp --header "Authorization: Bearer <MCP_API_KEY>"
```

Le fichier `.mcp.json` du projet fait la même chose avec les variables `AION2_MCP_URL` et `AION2_MCP_KEY`.

claude.ai / Claude Desktop (connecteur personnalisé, qui ne permet pas d'ajouter un en-tête) : utiliser l'URL
`https://votre-site.vercel.app/api/mcp?key=<MCP_API_KEY>`.

Utilisez le domaine public du projet (ex. `ion2-three.vercel.app`) : les URLs de déploiement
`*-pauletignard-*.vercel.app` sont protégées par l'authentification Vercel et bloquent le MCP.

Outils exposés :

| Outil | Rôle |
|---|---|
| `list_classes`, `get_class_data` | compétences / stigmas / spécialisations (avec IDs) et méta des meilleurs joueurs |
| `search_items`, `get_game_reference` | catalogue d'objets, activités, paliers d'item level, échelle d'équipement |
| `list_builds`, `get_build`, `validate_build`, `create_build`, `update_build`, `delete_build` | gestion des builds (IDs validés contre le client global) |
| `list_players`, `create_player`, `get_player_progress`, `update_player_progress`, `log_activity` | suivi des joueurs |
| `get_team_overview` | état des lieux de la team + suggestions de groupe |

Exemples de demandes : « crée un build PvP pour l'Assassin », « mets à jour la progression de Paul : niveau 45, IL 1 420 »,
« qu'est-ce que la team doit faire cette semaine ? ».

## Structure

```
prisma/schema.prisma        modèles : Player, PlayerProgress, Build, ActivityLog, ProgressSnapshot
prisma/builds.mjs           les 8 builds de départ
scripts/sync-game-data.mjs  synchro des données du client global
src/data/activities.ts      activités récurrentes, paliers, échelle d'équipement
src/lib/recommendations.ts  moteur de recommandations
src/lib/services.ts         logique partagée site + MCP
src/app/api/mcp/route.ts    serveur MCP
```
