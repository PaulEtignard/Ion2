"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { login } from "@/app/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="grid grid-cols-1 gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor="password">Mot de passe de la team</Label>
        <Input id="password" name="password" type="password" autoFocus required autoComplete="current-password" />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Entrer"}
      </Button>
    </form>
  );
}
