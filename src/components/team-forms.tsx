"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addPlayer, removePlayer } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CLASSES = [
  ["gladiator", "Gladiateur"],
  ["templar", "Templier"],
  ["assassin", "Assassin"],
  ["ranger", "Rôdeur"],
  ["sorcerer", "Sorcier"],
  ["spiritmaster", "Spiritualiste"],
  ["cleric", "Clerc"],
  ["chanter", "Aède"],
] as const;

export function AddPlayerForm() {
  const [state, action, pending] = useActionState(addPlayer, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [classId, setClassId] = useState<string>("gladiator");
  useEffect(() => {
    if (state && "ok" in state) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Pseudo en jeu</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div className="space-y-2">
        <Label>Classe</Label>
        <input type="hidden" name="classId" value={classId} />
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSES.map(([id, label]) => (
              <SelectItem key={id} value={id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/game/classes/${id}.webp`} alt="" className="size-5 rounded-full" />
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="faction">Faction</Label>
        <select id="faction" name="faction" className="border-input h-9 w-full rounded-md border bg-black/20 px-3 text-sm">
          <option value="ELYOS">Élyséens</option>
          <option value="ASMODIAN">Asmodiens</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="server">Serveur (optionnel)</Label>
        <Input id="server" name="server" placeholder="ex. Israphel" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter"}
        </Button>
        {state && "error" in state && <span className="text-destructive text-sm">{state.error}</span>}
        {state && "ok" in state && <span className="text-success text-sm">Joueur ajouté.</span>}
      </div>
    </form>
  );
}

export function DeletePlayerButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`Supprimer ${name}`}
      onClick={() => {
        if (confirm(`Supprimer ${name} et toute sa progression ?`)) start(() => removePlayer(id));
      }}
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
  );
}
