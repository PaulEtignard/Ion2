import Link from "next/link";
import { CalendarClock, CalendarDays, CheckCircle2, Hammer, Mountain, Sparkles, Users } from "lucide-react";
import { GameIcon } from "@/components/game/game-icon";
import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@/lib/recommendations";
import { cn } from "@/lib/utils";

const CATEGORY = {
  progression: { label: "Progression", icon: Mountain, className: "text-primary" },
  quotidien: { label: "Quotidien", icon: CalendarClock, className: "text-sky-400" },
  hebdo: { label: "Hebdo", icon: CalendarDays, className: "text-violet-400" },
  equipement: { label: "Équipement", icon: Hammer, className: "text-amber-400" },
  build: { label: "Build", icon: Sparkles, className: "text-emerald-400" },
  groupe: { label: "Groupe", icon: Users, className: "text-rose-400" },
} as const;

export function RecommendationList({ items, limit, compact }: { items: Recommendation[]; limit?: number; compact?: boolean }) {
  const list = limit ? items.slice(0, limit) : items;
  if (!list.length) return <p className="text-muted-foreground text-sm">Rien à signaler : tout est à jour.</p>;
  return (
    <ol className="space-y-2">
      {list.map((r, i) => {
        const cat = CATEGORY[r.category];
        const Icon = r.done ? CheckCircle2 : cat.icon;
        const content = (
          <div
            className={cn(
              "flex gap-3 rounded-lg border bg-black/15 p-3 transition-colors",
              r.href && "hover:bg-accent/40",
              r.done && "opacity-50",
            )}
          >
            {r.icon ? (
              <GameIcon src={r.icon} alt="" size={compact ? 32 : 40} />
            ) : (
              <span className={cn("flex shrink-0 items-center justify-center rounded-md border bg-black/30", compact ? "size-8" : "size-10", cat.className)}>
                <Icon className="size-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {!compact && <span className="text-muted-foreground text-xs tabular-nums">{i + 1}.</span>}
                <span className={cn("font-medium", compact && "text-sm")}>{r.title}</span>
                <Badge variant="outline" className={cn("text-[10px]", cat.className)}>
                  {cat.label}
                </Badge>
              </div>
              {!compact && r.detail && <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{r.detail}</p>}
            </div>
          </div>
        );
        // En mode compact, la liste est affichée dans une carte déjà cliquable : pas de lien imbriqué
        return <li key={r.id}>{r.href && !compact ? <Link href={r.href}>{content}</Link> : content}</li>;
      })}
    </ol>
  );
}
