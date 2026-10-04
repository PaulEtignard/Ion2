"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectPlayer } from "@/app/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PlayerSwitcher({ players, currentId }: { players: { id: string; name: string; classId: string }[]; currentId: string | null }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!players.length) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground hidden text-sm sm:inline">Je suis</span>
      <Select
        value={currentId ?? undefined}
        onValueChange={(id) =>
          start(async () => {
            await selectPlayer(id);
            router.refresh();
          })
        }
        disabled={pending}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Choisir mon perso" />
        </SelectTrigger>
        <SelectContent>
          {players.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/game/classes/${p.classId}.webp`} alt="" className="size-5 rounded-full" />
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
