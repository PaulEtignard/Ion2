"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="bg-card/80 space-y-3 rounded-xl border p-5 text-left backdrop-blur">
      <input type="hidden" name="next" value={next} />
      <label className="text-sm font-medium" htmlFor="password">
        Mot de passe de la team
      </label>
      <Input id="password" name="password" type="password" autoFocus required autoComplete="current-password" />
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Entrer"}
      </Button>
    </form>
  );
}
