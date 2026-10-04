/**
 * Session minimaliste : un cookie signé (HMAC-SHA256) après saisie du mot de passe d'équipe.
 * Utilise Web Crypto pour fonctionner aussi bien dans le proxy que dans les routes.
 */
export const SESSION_COOKIE = "aion2_session";
export const PLAYER_COOKIE = "aion2_player";
const MAX_AGE_DAYS = 60;

const enc = new TextEncoder();

async function hmac(data: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createSessionToken() {
  const exp = Date.now() + MAX_AGE_DAYS * 86_400_000;
  const payload = `team.${exp}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [scope, exp, sig] = parts;
  if (Number(exp) < Date.now()) return false;
  const expected = await hmac(`${scope}.${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const SESSION_MAX_AGE = MAX_AGE_DAYS * 86_400;

/** Comparaison à temps constant de deux chaînes (mots de passe, clés API) */
export function safeEqual(a: string, b: string) {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}
