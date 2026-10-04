/**
 * Clés de période pour les compteurs d'activités.
 * Le reset quotidien et le reset hebdo (mercredi) ont lieu à RESET_HOUR dans le fuseau RESET_TZ.
 * Le client ne stocke que le jour du reset, pas l'heure : réglez-la via les variables d'env.
 */
const RESET_HOUR = Number(process.env.NEXT_PUBLIC_RESET_HOUR ?? 6);
const RESET_TZ = process.env.NEXT_PUBLIC_RESET_TZ ?? "Europe/Paris";
const RESET_WEEKDAY = 3; // mercredi

function zonedParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESET_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), weekday };
}

/** Jour "de jeu" : avant l'heure de reset, on est encore sur la veille. */
function gameDay(date: Date) {
  const p = zonedParts(date);
  const base = new Date(Date.UTC(p.y, p.m - 1, p.d));
  let weekday = p.weekday;
  if (p.h < RESET_HOUR) {
    base.setUTCDate(base.getUTCDate() - 1);
    weekday = (weekday + 6) % 7;
  }
  return { base, weekday };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function dailyKey(date = new Date()) {
  return "D" + iso(gameDay(date).base);
}

export function weeklyKey(date = new Date()) {
  const { base, weekday } = gameDay(date);
  const diff = (weekday - RESET_WEEKDAY + 7) % 7;
  base.setUTCDate(base.getUTCDate() - diff);
  return "W" + iso(base);
}

export function periodKey(reset: "daily" | "weekly", date = new Date()) {
  return reset === "daily" ? dailyKey(date) : weeklyKey(date);
}

export function todayIso(date = new Date()) {
  return iso(gameDay(date).base);
}

export const RESET_INFO = { hour: RESET_HOUR, tz: RESET_TZ };
