import Link from "next/link";
import { ClassIcon } from "@/components/game/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { allClasses, CLASS_INFO } from "@/lib/game-data";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Classes" };

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Classes</h1>
        <p className="text-muted-foreground">Toutes les compétences, stigmas et spécialisations du client global, et ce que jouent les meilleurs joueurs.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {allClasses().map((c) => {
          const info = CLASS_INFO[c.id];
          return (
            <Link key={c.id} href={`/classes/${c.id}`} className="group">
              <Card className="group-hover:border-primary/50 h-full transition-colors">
                <CardHeader className="items-center text-center">
                  <ClassIcon classId={c.id} size={72} className="mx-auto" />
                  <CardTitle className="font-display pt-2 text-xl">{info.fr}</CardTitle>
                  <CardDescription>
                    {c.name} · {info.role} · {info.weapon}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-center">
                  <p className="text-muted-foreground text-sm">{info.blurb}</p>
                  {c.meta.medianCombatPower && (
                    <p className="text-xs">
                      Puissance médiane des meilleurs : <span className="text-primary font-semibold">{formatNumber(c.meta.medianCombatPower)}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
