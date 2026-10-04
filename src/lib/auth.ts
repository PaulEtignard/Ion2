import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/** Vrai si le visiteur a saisi le mot de passe de la team */
export async function isTeamMember() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Pages consultables sans mot de passe (lecture seule) */
export const PUBLIC_PREFIXES = ["/builds", "/classes"];
