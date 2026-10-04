"use client";

import * as React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type IconTooltip = {
  title: string;
  subtitle?: string;
  lines?: (string | null | undefined)[];
  body?: string | null;
  color?: string;
};

/** Icône du jeu dans un cadre coloré par la rareté, avec fiche détaillée au survol (HoverCard shadcn). */
export function GameIcon({
  src,
  alt,
  size = 40,
  rarity,
  badge,
  dim,
  tooltip,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  rarity?: string;
  badge?: React.ReactNode;
  dim?: boolean;
  tooltip?: IconTooltip;
  className?: string;
}) {
  const icon = (
    <span
      className={cn("game-icon", dim && "opacity-40 grayscale", className)}
      style={{ width: size, height: size, ["--rarity" as string]: rarity }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={size} height={size} loading="lazy" />
      ) : (
        <span className="text-muted-foreground flex h-full w-full items-center justify-center text-[10px]">?</span>
      )}
      {badge != null && (
        <span className="absolute right-0 bottom-0 rounded-tl bg-black/80 px-1 text-[10px] leading-tight font-bold text-white tabular-nums">
          {badge}
        </span>
      )}
    </span>
  );
  if (!tooltip) return icon;

  const lines = tooltip.lines?.filter(Boolean) ?? [];
  return (
    <HoverCard openDelay={80} closeDelay={40}>
      <HoverCardTrigger asChild>
        <span tabIndex={0} role="img" aria-label={alt} className="inline-flex cursor-help rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {icon}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <div className="flex gap-3">
          <span className="game-icon" style={{ width: 44, height: 44, ["--rarity" as string]: rarity }}>
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" width={44} height={44} />
            )}
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm leading-tight font-semibold" style={{ color: tooltip.color }}>
              {tooltip.title}
            </p>
            {tooltip.subtitle && <p className="text-muted-foreground text-xs">{tooltip.subtitle}</p>}
          </div>
        </div>
        {(tooltip.body || lines.length > 0) && <Separator className="my-3" />}
        {tooltip.body && <p className="text-sm leading-relaxed">{tooltip.body}</p>}
        {lines.map((l, i) => (
          <p key={i} className="text-muted-foreground mt-2 text-xs">
            {l}
          </p>
        ))}
      </HoverCardContent>
    </HoverCard>
  );
}
