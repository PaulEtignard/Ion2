"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type IconTooltip = {
  title: string;
  subtitle?: string;
  lines?: (string | null | undefined)[];
  body?: string | null;
  color?: string;
};

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
      className={cn("game-icon inline-block", dim && "opacity-40 grayscale", className)}
      style={{ width: size, height: size, ["--rarity" as string]: rarity }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={size} height={size} loading="lazy" />
      ) : (
        <span className="text-muted-foreground flex h-full w-full items-center justify-center text-[10px]">?</span>
      )}
      {badge != null && (
        <span className="absolute right-0 bottom-0 rounded-tl bg-black/80 px-1 text-[10px] leading-tight font-bold text-white">{badge}</span>
      )}
    </span>
  );
  if (!tooltip) return icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="cursor-help rounded-md focus-visible:outline-2" aria-label={alt}>
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <div className="text-sm font-semibold" style={{ color: tooltip.color }}>
            {tooltip.title}
          </div>
          {tooltip.subtitle && <div className="text-muted-foreground">{tooltip.subtitle}</div>}
          {tooltip.lines?.filter(Boolean).map((l, i) => (
            <div key={i} className="text-muted-foreground">
              {l}
            </div>
          ))}
          {tooltip.body && <p className="pt-1 leading-relaxed">{tooltip.body}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
