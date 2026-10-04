import Link from "next/link";
import { ClassIcon } from "@/components/game/icons";
import { AddPlayerForm, DeletePlayerButton } from "@/components/team-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClassIdT } from "@/lib/build-schema";
import { CLASS_INFO } from "@/lib/game-data";
import { listPlayers } from "@/lib/services";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Équipe" };

export default async function TeamPage() {
  const players = await listPlayers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Équipe</h1>
        <p className="text-muted-foreground">Les membres de la team et leur personnage principal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membres ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-muted-foreground text-sm">Personne pour l&apos;instant.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Joueur</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Faction</TableHead>
                  <TableHead className="text-right">Niveau</TableHead>
                  <TableHead className="text-right">Item level</TableHead>
                  <TableHead>Build</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/joueurs/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                      {p.server && <span className="text-muted-foreground ml-2 text-xs">{p.server}</span>}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <ClassIcon classId={p.classId as ClassIdT} size={22} /> {CLASS_INFO[p.classId as ClassIdT].fr}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.faction === "ELYOS" ? "Élyséen" : "Asmodien"}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.progress?.level ?? 1}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(p.progress?.itemLevel ?? 0)}</TableCell>
                    <TableCell className="text-sm">
                      {p.progress?.build ? (
                        <Link href={`/builds/${p.progress.build.slug}`} className="hover:underline">
                          {p.progress.build.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeletePlayerButton id={p.id} name={p.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Ajouter un joueur</CardTitle>
          <CardDescription>Chaque membre choisit ensuite son perso avec le sélecteur « Je suis » en haut.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddPlayerForm />
        </CardContent>
      </Card>
    </div>
  );
}
