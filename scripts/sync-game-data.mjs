#!/usr/bin/env node
/**
 * Synchronise les données de jeu AION 2 (client GLOBAL) depuis metabot.gg,
 * qui lit directement les fichiers du client global.
 *
 *   npm run data:sync              -> télécharge (avec cache) + génère src/data/game/*.json
 *   npm run data:sync -- --fresh   -> ignore le cache HTML
 *   npm run data:sync -- --no-icons
 *
 * Les icônes sont copiées dans public/game/** pour ne pas dépendre d'un site tiers.
 * Icônes et noms © NCSOFT — usage privé, non commercial.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, ".cache", "metabot");
const OUT = path.join(ROOT, "src", "data", "game");
const PUBLIC = path.join(ROOT, "public", "game");
const BASE = "https://metabot.gg";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 aion2-team-sync";

const args = new Set(process.argv.slice(2));
const FRESH = args.has("--fresh");
const NO_ICONS = args.has("--no-icons");

const CLASSES = ["gladiator", "templar", "assassin", "ranger", "sorcerer", "spiritmaster", "cleric", "chanter"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(urlPath) {
  const file = path.join(CACHE, urlPath.replace(/^\//, "").replace(/[/?=&]/g, "_") + ".html");
  if (!FRESH) {
    try {
      return await fs.readFile(file, "utf8");
    } catch {}
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(BASE + urlPath, { headers: { "user-agent": UA } });
    if (res.ok) {
      const html = await res.text();
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, html);
      await sleep(700);
      return html;
    }
    if (res.status === 404) throw new Error(`404 sur ${urlPath}`);
    console.warn(`  ${res.status} sur ${urlPath}, nouvel essai…`);
    await sleep(2000 * attempt);
  }
  throw new Error(`Impossible de télécharger ${urlPath}`);
}

function decode(s) {
  return s
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

/** Transforme le HTML en lignes de texte ; les images deviennent [IMG:url]. */
function toLines(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<a [^>]*href="\/en\/aion-2\/items\/([a-z0-9-]+)"[^>]*>/g, (_, slug) => ` [ITEM:${slug}] `)
    .replace(/<img[^>]*src="\/api\/image\?src=([^"&]+)[^"]*"[^>]*>/g, (_, u) => ` [IMG:${decodeURIComponent(u)}] `)
    .replace(/<(tr|li|p|h2|h3|h4|div)[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, " ");
  s = decode(s);
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

/** Sépare un éventuel jeton [ITEM:slug] du reste de la ligne */
function takeItem(line) {
  const m = line.match(/\[ITEM:([a-z0-9-]+)\]/);
  return { slug: m?.[1] ?? null, line: line.replace(/\s*\[ITEM:[a-z0-9-]+\]\s*/g, " ").trim() };
}

const referencedItems = new Set();

function sliceLines(lines, startPredicate, endPredicate) {
  const i = lines.findIndex(startPredicate);
  if (i < 0) return [];
  const rest = lines.slice(i + 1);
  const j = rest.findIndex(endPredicate);
  return j < 0 ? rest : rest.slice(0, j);
}

const num = (s) => (s == null ? null : Number(String(s).replace(/[,+%]/g, "")));
const iconName = (url) => url.split("/").pop();

// ---------------------------------------------------------------- icônes
const iconQueue = new Map(); // url -> fichier local relatif à public/
function icon(url, folder) {
  if (!url) return null;
  const local = `/game/${folder}/${iconName(url)}`;
  iconQueue.set(url, local);
  return local;
}

async function downloadIcons() {
  const entries = [...iconQueue.entries()];
  let done = 0,
    skipped = 0,
    failed = 0;
  const worker = async () => {
    while (entries.length) {
      const [url, local] = entries.shift();
      const file = path.join(ROOT, "public", local);
      try {
        await fs.access(file);
        skipped++;
        continue;
      } catch {}
      try {
        const res = await fetch(url, { headers: { "user-agent": UA } });
        if (!res.ok) throw new Error(String(res.status));
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
        done++;
        await sleep(120);
      } catch (e) {
        failed++;
        console.warn(`  icône KO ${url}: ${e.message}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  console.log(`Icônes : ${done} téléchargées, ${skipped} déjà présentes, ${failed} en échec.`);
}

// ---------------------------------------------------------------- classes
function parseSkillTable(html, sectionId) {
  const m = html.match(new RegExp(`<section id="${sectionId}"[\\s\\S]*?</section>`));
  if (!m) return [];
  const rows = [...m[0].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => r[1]).filter((r) => r.includes("<th scope=\"row\""));
  return rows.map((row) => {
    const slug = row.match(/href="\/en\/aion-2\/skills\/([^"]+)"/)?.[1];
    const iconUrl = decodeURIComponent(row.match(/src="\/api\/image\?src=([^"&]+)/)?.[1] ?? "");
    const id = Number(iconName(iconUrl).replace(".webp", ""));
    const name = decode(row.match(/nameText">([^<]+)</)?.[1] ?? "");
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((t) => decode(t[1].replace(/<[^>]+>/g, "")).trim());
    const [unlock, cooldown, maxLevel, effect] = tds;
    return {
      id,
      slug,
      name,
      unlockLevel: num(unlock?.replace("Lv.", "")),
      cooldown: cooldown && cooldown !== "—" ? cooldown : null,
      maxLevel: num(maxLevel),
      effect: effect ?? "",
      icon: icon(iconUrl, "skills"),
    };
  });
}

function parseBuildPage(html, className) {
  const lines = toLines(html);
  const meta = {};
  for (const l of lines) {
    let m;
    if ((m = l.match(/^Top players tracked ([\d,]+)/))) meta.topPlayersTracked = num(m[1]);
    if ((m = l.match(/^Median combat power ([\d,]+)/))) meta.medianCombatPower = num(m[1]);
    if ((m = l.match(/^Top 10% from ([\d,]+)/))) meta.top10CombatPower = num(m[1]);
    if ((m = l.match(/^Avg\. item level ([\d,]+)/))) meta.avgItemLevel = num(m[1]);
    if (meta.avgItemLevel) break;
  }

  const pickLine = /^\[IMG:([^\]]+)\] (.+?) ([\d.]+)% avg\. Lv\. ([\d.]+)$/;
  const parsePicks = (ls) =>
    ls
      .map((l) => l.match(pickLine))
      .filter(Boolean)
      .map((m) => ({ id: Number(iconName(m[1]).replace(".webp", "")), name: m[2], pickRate: num(m[3]), avgLevel: num(m[4]) }));

  const activePicks = parsePicks(sliceLines(lines, (l) => l === "Active skills on the bar", (l) => l === "Passive skills"));
  const passivePicks = parsePicks(sliceLines(lines, (l) => l === "Passive skills", (l) => l.startsWith("Load the most common")));
  const stigmaPicks = parsePicks(
    sliceLines(lines, (l) => l.startsWith(`Most used ${className} stigmas`), (l) => l.startsWith("Daevanion picks")),
  );

  const daevanionNodes = sliceLines(lines, (l) => l === "Most picked skill nodes", (l) => l.startsWith("Open the most common"))
    .map((l) => l.match(/^(.+?) \+(\d+) \((\w+)\) ([\d.]+)%$/))
    .filter(Boolean)
    .map((m) => ({ skill: m[1], bonus: num(m[2]), board: m[3], pickRate: num(m[4]) }));
  const daevanionBoards = sliceLines(lines, (l) => l.startsWith("Daevanion picks of top"), (l) => l === "Most picked skill nodes")
    .map((l) => l.match(/^(\w+) (\d+)\/(\d+) nodes/))
    .filter(Boolean)
    .map((m) => ({ board: m[1], commonNodes: num(m[2]), totalNodes: num(m[3]) }));

  // Équipement le plus porté, par emplacement
  const SLOTS = ["Main hand", "Off-hand", "Helmet", "Shoulders", "Chest", "Legs", "Gloves", "Boots", "Cape", "Necklace", "Earring", "Ring", "Bracelet", "Belt", "Amulet", "Rune"];
  const slotRe = new RegExp(`^(.*?)\\s*(${SLOTS.join("|")})$`);
  const gear = {};
  {
    let current = null;
    for (const raw of sliceLines(lines, (l) => l.startsWith(`Most used ${className} gear by slot`), (l) => l.startsWith("Enchant levels by slot"))) {
      let { slug, line: l } = takeItem(raw);
      if (SLOTS.includes(l)) {
        current = l;
        continue;
      }
      let next = null;
      const sm = l.match(slotRe);
      if (sm && sm[1]) {
        l = sm[1];
        next = sm[2];
      }
      const m = l.match(/^\[IMG:([^\]]+)\] (.+?) ([\d.]+)% avg\. \+([\d.]+)$/);
      if (m && current) {
        if (slug) referencedItems.add(slug);
        (gear[current] ??= []).push({ slug, name: m[2], icon: icon(m[1], "items"), pickRate: num(m[3]), avgEnchant: num(m[4]) });
      }
      if (next) current = next;
    }
  }

  const enchants = {};
  {
    const ls = sliceLines(lines, (l) => l.startsWith("Enchant levels by slot"), (l) => l.startsWith("Manastones and Theostones"));
    for (let i = 0; i < ls.length - 1; i++) {
      const m = ls[i + 1].match(/^avg\. \+([\d.]+) most: \+(\d+) \(([\d.]+)%\)/);
      if (SLOTS.includes(ls[i]) && m) enchants[ls[i]] = { avg: num(m[1]), most: num(m[2]), mostShare: num(m[3]) };
    }
  }

  const manastones = sliceLines(lines, (l) => l === "Manastone stats", (l) => l.startsWith("Arcana by slot"))
    .map((l) => l.match(/^(.+?) ([\d.]+)% avg\. \+([\d.]+%?)$/))
    .filter(Boolean)
    .map((m) => ({ stat: m[1], pickRate: num(m[2]), avgValue: m[3] }));

  const arcana = {};
  {
    let current = null;
    for (const raw of sliceLines(lines, (l) => l.startsWith("Arcana by slot"), (l) => l.startsWith("Titles, wings and pets"))) {
      let { slug, line: l } = takeItem(raw);
      let next = null;
      const sm = l.match(/^(.*?)\s*(Arcana slot \d)$/);
      if (sm) {
        l = sm[1];
        next = sm[2];
      }
      const m = l.match(/^\[IMG:([^\]]+)\] (.+?) ([\d.]+)% avg\. \+([\d.]+)$/);
      if (m && current) {
        const arr = (arcana[current] ??= []);
        if (slug) referencedItems.add(slug);
        if (!arr.some((a) => a.name === m[2])) arr.push({ slug, name: m[2], icon: icon(m[1], "items"), pickRate: num(m[3]) });
      }
      if (next) current = next;
    }
  }

  const wingsPets = sliceLines(lines, (l) => l === "Wings", (l) => l.startsWith("Average stats of top"));
  const wings = [];
  const pets = [];
  {
    let target = wings;
    for (const l of wingsPets) {
      if (l === "Pets") {
        target = pets;
        continue;
      }
      const m = l.match(/^\[IMG:([^\]]+)\] (.+?) ([\d.]+)% avg\./);
      if (m && !target.some((x) => x.name === m[2]))
        target.push({ name: m[2], icon: icon(m[1], target === wings ? "wings" : "pets"), pickRate: num(m[3]) });
    }
  }

  const statBlock = (start, end) =>
    sliceLines(lines, (l) => l === start, (l) => l === end || l.startsWith("Top 10 "))
      .map((l) => l.match(/^(.+?) ([\d.]+)$/))
      .filter(Boolean)
      .map((m) => ({ stat: m[1], avg: num(m[2]) }));
  const primaryStats = statBlock("Primary stats", "Deity stats");
  const deityStats = statBlock("Deity stats", "__none__");

  const specializations = sliceLines(lines, (l) => l === `${className} specializations by skill level` && true, (l) => l.startsWith(`Daevanion skill levels for the ${className}`))
    .map((l) => l.match(/^\[IMG:([^\]]+\/stigma\/(\d+)\.webp)\] (.+?) Lv\. (\d+) (.+)$/))
    .filter(Boolean)
    .map((m) => {
      const id = Number(m[2]);
      const effect = m[5].replace(/\s*Show \d+ more specializations?/i, "").trim();
      return { id, skillId: Math.floor(id / 100) * 100, skillName: m[3], requiredSkillLevel: num(m[4]), effect, icon: icon(m[1], "specs") };
    });
  // dédoublonnage (le tableau apparaît parfois deux fois dans le HTML)
  const specs = [...new Map(specializations.map((s) => [s.id, s])).values()];

  const pointsTable = sliceLines(lines, (l) => l.startsWith("Level Skill points Stigma points Stigma slots"), (l) => l.startsWith("Point totals are"))
    .map((l) => l.match(/^(\d+) (\d+) (\d+) (\d+) (\d+) \/ (\d+)$/))
    .filter(Boolean)
    .map((m) => ({ level: num(m[1]), skillPoints: num(m[2]), stigmaPoints: num(m[3]), stigmaSlots: num(m[4]) }));

  return {
    meta,
    picks: { active: activePicks, passive: passivePicks, stigma: stigmaPicks },
    daevanion: { boards: daevanionBoards, topSkillNodes: daevanionNodes },
    gear,
    enchants,
    manastones,
    arcana,
    wings,
    pets,
    primaryStats,
    deityStats,
    specializations: specs,
    pointsTable,
  };
}

async function syncClasses() {
  const index = [];
  for (const id of CLASSES) {
    const name = id[0].toUpperCase() + id.slice(1);
    console.log(`Classe ${name}…`);
    const classHtml = await fetchPage(`/en/aion-2/classes/${id}`);
    const buildHtml = await fetchPage(`/en/aion-2/classes/${id}/build`);

    const actives = parseSkillTable(classHtml, "skills").map((s) => ({ ...s, type: "active" }));
    const passives = parseSkillTable(classHtml, "passives").map((s) => ({ ...s, type: "passive" }));
    const stigmas = parseSkillTable(classHtml, "stigma").map((s) => ({ ...s, type: "stigma" }));
    const build = parseBuildPage(buildHtml, name);

    // Compétence sans icône sur la source : on déduit l'ID de la numérotation (pas de 10000)
    for (const list of [actives, passives, stigmas]) {
      list.forEach((s, i) => {
        if (s.id) return;
        const prev = list[i - 1]?.id;
        const next = list[i + 1]?.id;
        s.id = prev ? prev + 10000 : next ? next - 10000 : 0;
        s.icon = null;
        console.warn(`  ⚠ ${s.name} sans icône : ID déduit ${s.id}`);
      });
    }
    const pick = (list, sid) => list.find((p) => p.id === sid);
    for (const s of actives) Object.assign(s, { meta: pick(build.picks.active, s.id) ?? null });
    for (const s of passives) Object.assign(s, { meta: pick(build.picks.passive, s.id) ?? null });
    for (const s of stigmas) Object.assign(s, { meta: pick(build.picks.stigma, s.id) ?? null });

    const classIconUrl = `${BASE}/web/aion2/classes/${id}.webp`;
    const data = {
      id,
      name,
      icon: icon(classIconUrl, "classes"),
      skills: [...actives, ...passives],
      stigmas,
      specializations: build.specializations,
      meta: {
        ...build.meta,
        daevanion: build.daevanion,
        gear: build.gear,
        enchants: build.enchants,
        manastones: build.manastones,
        arcana: build.arcana,
        wings: build.wings,
        pets: build.pets,
        primaryStats: build.primaryStats,
        deityStats: build.deityStats,
      },
      pointsTable: build.pointsTable,
      source: `${BASE}/en/aion-2/classes/${id}/build`,
    };
    console.log(
      `  ${actives.length} actifs, ${passives.length} passifs, ${stigmas.length} stigmas, ${build.specializations.length} spécialisations, ${Object.keys(build.gear).length} emplacements d'équipement`,
    );
    if (actives.length !== 12 || passives.length !== 10 || stigmas.length !== 13)
      console.warn(`  ⚠ nombre de compétences inattendu pour ${name}`);
    await fs.writeFile(path.join(OUT, "classes", `${id}.json`), JSON.stringify(data, null, 1));
    index.push({ id, name, icon: data.icon });
  }
  return index;
}

// ---------------------------------------------------------------- objets
async function syncItems() {
  const items = new Map();
  for (const page of ["weapons", "armor", "accessories", "arcana"]) {
    console.log(`Objets : ${page}…`);
    const html = await fetchPage(`/en/aion-2/${page}`);
    // On découpe par titre h2/h3 pour connaître la catégorie de chaque tableau
    const parts = html.split(/<h[23][^>]*>/);
    for (const part of parts) {
      const heading = decode((part.match(/^([\s\S]*?)<\/h[23]>/)?.[1] ?? "").replace(/<[^>]+>/g, "")).trim();
      const category = heading.replace(/ list$/, "").replace(/s$/, "");
      for (const r of part.matchAll(/<tr data-k="([^"]+)">([\s\S]*?)<\/tr>/g)) {
        const row = r[2];
        const slug = row.match(/href="\/en\/aion-2\/items\/([^"]+)"/)?.[1];
        if (!slug || items.has(slug)) continue;
        const iconUrl = decodeURIComponent(row.match(/src="\/api\/image\?src=([^"&]+)/)?.[1] ?? "");
        const name = decode(row.match(/nameText"[^>]*>([^<]+)</)?.[1] ?? "");
        const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((t) => decode(t[1].replace(/<[^>]+>/g, "")).trim());
        const [grade, itemLevel, requiredLevel, stats] = tds;
        items.set(slug, {
          slug,
          name,
          group: page,
          category: page === "arcana" ? "Arcana" : category || page,
          grade,
          itemLevel: num(itemLevel) || null,
          requiredLevel: num(requiredLevel) || null,
          stats: stats && stats !== "—" ? stats : null,
          icon: iconUrl ? icon(iconUrl, "items") : null,
        });
      }
    }
  }
  // Pages de détail : objets réellement portés par les meilleurs joueurs + extras manuels
  let extras = [];
  try {
    extras = (await fs.readFile(path.join(ROOT, "scripts", "extra-items.txt"), "utf8"))
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  } catch {}
  const toDetail = [...new Set([...referencedItems, ...extras])];
  console.log(`  ${toDetail.length} fiches détaillées à lire…`);
  for (const slug of toDetail) {
    try {
      const detail = parseItemDetail(slug, await fetchPage(`/en/aion-2/items/${slug}`));
      if (detail) items.set(slug, { ...items.get(slug), ...detail });
    } catch (e) {
      console.warn(`  objet ${slug} : ${e.message}`);
    }
  }

  const list = [...items.values()];
  console.log(`  ${list.length} objets`);
  await fs.writeFile(path.join(OUT, "items.json"), JSON.stringify(list));
}

// Les pages de détail utilisent d'autres libellés que les listes : on normalise sur ceux des listes.
const CATEGORY_ALIASES = {
  Sword: "Longsword", Magicbook: "Spellbook", Guarder: "Guard", Pauldrons: "Pauldron", Breastplate: "Top", Greaves: "Leg",
  Gloves: "Glove", Boots: "Shoe", Shoes: "Shoe", Legs: "Leg", Earrings: "Earring", Rings: "Ring", Bracelets: "Bracelet", Cape: "Cloak",
  Bell: "Arcana", Chalice: "Arcana", Compass: "Arcana", Mirror: "Arcana", Parchment: "Arcana",
};
const CATEGORY_GROUP = {
  Greatsword: "weapons", Longsword: "weapons", Dagger: "weapons", Bow: "weapons", Spellbook: "weapons",
  Orb: "weapons", Mace: "weapons", Staff: "weapons", Guard: "weapons",
  Helm: "armor", Pauldron: "armor", Top: "armor", Leg: "armor", Glove: "armor", Shoe: "armor", Cloak: "armor",
  Necklace: "accessories", Earring: "accessories", Ring: "accessories", Bracelet: "accessories", Belt: "accessories",
  Amulet: "accessories", Rune: "accessories", Arcana: "arcana",
};

function parseItemDetail(slug, html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch {
      return null;
    }
  });
  const thing = blocks.find((b) => b?.["@type"] === "Thing");
  if (!thing) return null;
  const faq = blocks.find((b) => b?.["@type"] === "FAQPage");
  const answer = (re) => faq?.mainEntity?.find((q) => re.test(q.name))?.acceptedAnswer?.text ?? null;
  const d = thing.description ?? "";
  const m = d.match(/is an? (Common|Rare|Epic|Unique|Legendary|Heroic|Mythic|Special) (.+?) in AION 2 with item level (\d+), usable from character level (\d+)/);
  const rawCategory = m?.[2] ?? null;
  const category = rawCategory ? (CATEGORY_ALIASES[rawCategory] ?? rawCategory) : null;
  const stats = answer(/stats/i)?.match(/fixed stats: (.+?)\. It also/)?.[1] ?? null;
  return {
    slug,
    name: decode(thing.name),
    group: CATEGORY_GROUP[category] ?? "other",
    category: category ?? "Other",
    grade: m?.[1] ?? null,
    itemLevel: m ? Number(m[3]) : null,
    requiredLevel: m ? Number(m[4]) : null,
    stats: stats ? stats.replace(/, /g, " · ") : null,
    source: answer(/How do I get/i)?.replace(/\s*The table above[^.]*\./, "") ?? null,
    icon: thing.image ? icon(thing.image, "items") : null,
  };
}

// ---------------------------------------------------------------- donjons
async function syncDungeons() {
  console.log("Donjons…");
  const html = await fetchPage("/en/aion-2/dungeons");
  // Images des donjons : présentes dans le JSON-LD ItemList
  const images = new Map(
    [...html.matchAll(/"url":"https:\/\/metabot\.gg\/en\/aion-2\/dungeons\/([a-z0-9-]+)","image":"([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );
  const TYPES = ["Party Dungeon", "Raid", "Ascension Trial", "Growth Dungeon", "Daily Dungeon", "Sealed Dungeon", "Arena", "Legion Content", "Ascension Instance", "Boss Challenge"];
  const parts = html.split(/<h2[^>]*>/);
  const out = new Map();
  for (const part of parts) {
    const headingText = decode(part.slice(0, 300).replace(/<[^>]+>/g, " ")).trim();
    const type = TYPES.find((t) => headingText.startsWith(t));
    if (!type) continue;
    for (const r of part.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const row = r[1];
      const slug = row.match(/href="\/en\/aion-2\/dungeons\/([^"#]+)"/)?.[1];
      if (!slug || out.has(slug)) continue;
      const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((t) =>
        decode(t[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(),
      );
      const name = cells[0].replace(/\s*Map$/, "").trim();
      const bosses = [...row.matchAll(/src="\/api\/image\?src=[^"]*npcs[^"]*"[^>]*>(?:\s*<\/span>)?\s*(?:<span[^>]*>)?\s*([^<]+)/g)]
        .map((b) => decode(b[1]).trim())
        .filter((b) => b && !b.startsWith("+"));
      const entry = { slug, name, type, bosses, image: images.has(slug) ? icon(images.get(slug), "dungeons") : null };
      const rest = cells.slice(1);
      if (type === "Party Dungeon" || type === "Raid")
        entry.partySize = num(rest.find((c) => /^\d+$/.test(c))) ?? (type === "Raid" ? 10 : 5);
      else {
        const lvl = rest.find((c) => /^\d+$/.test(c));
        if (lvl) entry.level = num(lvl);
        const region = rest.find((c) => /^[A-Z][a-z]+$/.test(c));
        if (region) entry.region = region;
      }
      out.set(slug, entry);
    }
  }
  const list = [...out.values()];
  console.log(`  ${list.length} donjons`);
  await fs.writeFile(path.join(OUT, "dungeons.json"), JSON.stringify(list, null, 1));
}

// ---------------------------------------------------------------- main
await fs.mkdir(path.join(OUT, "classes"), { recursive: true });
const index = await syncClasses();
// Icône manquante : reprendre celle d'une compétence homonyme d'une autre classe
{
  const all = await Promise.all(CLASSES.map(async (id) => JSON.parse(await fs.readFile(path.join(OUT, "classes", `${id}.json`), "utf8"))));
  const byName = new Map(all.flatMap((c) => [...c.skills, ...c.stigmas]).filter((s) => s.icon).map((s) => [s.name, s.icon]));
  for (const c of all) {
    let changed = false;
    for (const s of [...c.skills, ...c.stigmas]) if (!s.icon && byName.has(s.name)) ((s.icon = byName.get(s.name)), (changed = true));
    if (changed) await fs.writeFile(path.join(OUT, "classes", `${c.id}.json`), JSON.stringify(c, null, 1));
  }
}
await syncItems();
await syncDungeons();
await fs.writeFile(
  path.join(OUT, "meta.json"),
  JSON.stringify({ source: "metabot.gg (client global AION 2)", syncedAt: new Date().toISOString(), classes: index }, null, 1),
);
// Icônes des activités (tickets) référencées dans src/data/activities.ts
{
  const src = await fs.readFile(path.join(ROOT, "src", "data", "activities.ts"), "utf8");
  for (const m of src.matchAll(/"\/game\/items\/([a-z0-9_]+\.webp)"/g)) icon(`${BASE}/web/aion2/items/${m[1]}`, "items");
}
if (!NO_ICONS) await downloadIcons();
console.log("Terminé.");
