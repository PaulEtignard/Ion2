import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/game/classes/gladiator.webp" alt="" className="mx-auto size-16 rounded-full opacity-90" />
          <h1 className="font-display text-3xl font-bold text-primary">Team AION 2</h1>
          <p className="text-muted-foreground text-sm">Builds, progression et objectifs de la team — serveur global.</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
