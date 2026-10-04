import { GameIcon } from "@/components/game/game-icon";
import { CLASS_INFO, getItem, getSkill, getSpec, GRADE_COLORS } from "@/lib/game-data";
import type { ClassIdT } from "@/lib/build-schema";
import { cn } from "@/lib/utils";

const TYPE_LABEL = { active: "Compétence active", passive: "Passif", stigma: "Stigma" } as const;

export function SkillIcon({ id, size = 40, level, dim, showName, className }: { id: number; size?: number; level?: number | string; dim?: boolean; showName?: boolean; className?: string }) {
  const s = getSkill(id);
  if (!s) return <GameIcon alt={`#${id}`} size={size} />;
  const icon = (
    <GameIcon
      src={s.icon}
      alt={s.name}
      size={size}
      dim={dim}
      badge={level}
      rarity={s.type === "stigma" ? "#c084fc" : s.type === "passive" ? "#94a3b8" : "#FFD02B"}
      tooltip={{
        title: s.name,
        subtitle: [TYPE_LABEL[s.type], s.unlockLevel && `niv. ${s.unlockLevel}`, s.cooldown && `recharge ${s.cooldown}`].filter(Boolean).join(" · "),
        body: s.effect,
        lines: [s.meta ? `Joué par ${s.meta.pickRate}% des meilleurs joueurs (niv. moy. ${s.meta.avgLevel})` : null],
      }}
    />
  );
  if (!showName) return icon;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {icon}
      <span className="text-sm font-medium">{s.name}</span>
    </span>
  );
}

export function SpecIcon({ id, size = 32, showText }: { id: number; size?: number; showText?: boolean }) {
  const s = getSpec(id);
  if (!s) return <GameIcon alt={`#${id}`} size={size} />;
  const icon = (
    <GameIcon
      src={s.icon}
      alt={s.effect}
      size={size}
      rarity="#38bdf8"
      tooltip={{ title: s.effect, subtitle: `Spécialisation de ${s.skillName} · niveau de compétence ${s.requiredSkillLevel}` }}
    />
  );
  if (!showText) return icon;
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      <span className="text-sm">
        {s.effect} <span className="text-muted-foreground text-xs">(niv. {s.requiredSkillLevel})</span>
      </span>
    </span>
  );
}

export function ItemIcon({ name, slug, size = 40, enchant, fallbackIcon, showName, className }: { name: string; slug?: string; size?: number; enchant?: number; fallbackIcon?: string | null; showName?: boolean; className?: string }) {
  const it = getItem(slug ?? name) ?? getItem(name);
  const color = it?.grade ? GRADE_COLORS[it.grade] : undefined;
  const icon = (
    <GameIcon
      src={it?.icon ?? fallbackIcon}
      alt={name}
      size={size}
      rarity={color}
      badge={enchant ? `+${enchant}` : undefined}
      tooltip={{
        title: it?.name ?? name,
        color,
        subtitle: it ? [it.grade, it.category, it.itemLevel && `IL ${it.itemLevel}`, it.requiredLevel && `niv. ${it.requiredLevel}`].filter(Boolean).join(" · ") : "Objet hors catalogue",
        lines: [it?.stats],
        body: it?.source ?? null,
      }}
    />
  );
  if (!showName) return icon;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {icon}
      <span className="text-sm font-medium" style={{ color }}>
        {it?.name ?? name}
      </span>
    </span>
  );
}

export function ItemName({ name, slug }: { name: string; slug?: string }) {
  const it = getItem(slug ?? name) ?? getItem(name);
  return (
    <div className="font-semibold" style={{ color: it?.grade ? GRADE_COLORS[it.grade] : undefined }}>
      {it?.name ?? name}
      {it?.itemLevel && <span className="text-muted-foreground ml-2 text-xs font-normal">IL {it.itemLevel}</span>}
    </div>
  );
}

export function ClassIcon({ classId, size = 32, showName, className }: { classId: ClassIdT; size?: number; showName?: boolean; className?: string }) {
  const info = CLASS_INFO[classId];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/game/classes/${classId}.webp`} alt={info.fr} width={size} height={size} className="rounded-full" style={{ width: size, height: size }} />
      {showName && <span className="font-medium">{info.fr}</span>}
    </span>
  );
}
