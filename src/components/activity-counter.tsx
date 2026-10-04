"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { setCount } from "@/app/actions";
import { cn } from "@/lib/utils";

export function ActivityCounter({
  playerId,
  activityKey,
  count,
  target,
  max,
  locked,
}: {
  playerId: string;
  activityKey: string;
  count: number;
  target: number;
  max: number;
  locked?: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(count);
  const [, start] = useTransition();
  const done = optimistic >= target;

  if (locked)
    return (
      <span className="text-muted-foreground/60 text-[11px]" title={locked}>
        verrouillé
      </span>
    );

  const change = (v: number) =>
    start(async () => {
      const next = Math.max(0, Math.min(max, v));
      setOptimistic(next);
      await setCount(playerId, activityKey, next);
    });

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1 py-0.5",
        done ? "border-success/50 bg-success/10 text-success" : "bg-black/20",
      )}
    >
      <button type="button" aria-label="Retirer" onClick={() => change(optimistic - 1)} className="hover:text-foreground text-muted-foreground p-0.5">
        <Minus className="size-3" />
      </button>
      <button type="button" onClick={() => change(done ? 0 : target)} className="min-w-10 text-center text-xs font-semibold tabular-nums" title={done ? "Remettre à zéro" : "Tout cocher"}>
        {done ? <Check className="mx-auto size-3.5" /> : `${optimistic}/${target}`}
      </button>
      <button type="button" aria-label="Ajouter" onClick={() => change(optimistic + 1)} className="hover:text-foreground text-muted-foreground p-0.5">
        <Plus className="size-3" />
      </button>
    </div>
  );
}
