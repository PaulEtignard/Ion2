"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addPlayer, removePlayer } from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
  useEffect(() => {
    if (!state) return;
    if ("ok" in state) {
      toast.success("Joueur ajouté");
      formRef.current?.reset();
    } else if ("error" in state) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor="name">Pseudo en jeu</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Label>Classe</Label>
        <Select name="classId" defaultValue="gladiator">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSES.map(([id, label]) => (
              <SelectItem key={id} value={id}>
                <Avatar className="size-5">
                  <AvatarImage src={`/game/classes/${id}.webp`} alt="" />
                </Avatar>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Label>Faction</Label>
        <Select name="faction" defaultValue="ELYOS">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ELYOS">Élyséens</SelectItem>
            <SelectItem value="ASMODIAN">Asmodiens</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Label htmlFor="server">Serveur (optionnel)</Label>
        <Input id="server" name="server" placeholder="ex. Israphel" />
      </div>
      <div className="@xl/main:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}

export function DeletePlayerButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} aria-label={`Supprimer ${name}`}>
          <Trash2 className="text-muted-foreground" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {name} ?</AlertDialogTitle>
          <AlertDialogDescription>Toute sa progression, son historique et ses compteurs d&apos;activités seront effacés.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() =>
              start(async () => {
                await removePlayer(id);
                toast.success(`${name} a été retiré de la team`);
              })
            }
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
