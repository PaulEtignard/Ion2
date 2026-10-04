import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="app-backdrop flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" className="mx-auto mb-2 size-14 rounded-xl" />
          <CardTitle className="font-display text-primary text-2xl">Team AION 2</CardTitle>
          <CardDescription>Espace réservé à la team : progression, activités et objectifs.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={next ?? "/"} />
        </CardContent>
        <CardFooter className="flex-col gap-2 border-t">
          <p className="text-muted-foreground text-center text-xs">Les builds et les classes sont consultables sans mot de passe.</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/builds">
              <BookOpen /> Voir les builds
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
