import "server-only";
import { cookies } from "next/headers";
import { PLAYER_COOKIE } from "@/lib/session";
import { listPlayers } from "@/lib/services";

/** Joueur sélectionné (cookie) + la liste complète, pour le sélecteur de l'en-tête */
export async function getCurrentPlayerContext() {
  const players = await listPlayers();
  const id = (await cookies()).get(PLAYER_COOKIE)?.value;
  const current = players.find((p) => p.id === id) ?? null;
  return { players, current };
}
