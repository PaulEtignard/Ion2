"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveProgress } from "@/app/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameIcon } from "@/components/game/game-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SkillOpt = { id: number; name: string; icon: string | null; type: string; target: number | null };

export type ProgressFormProps = {
  playerId: string;
  initial: {
    level: number;
    itemLevel: number;
    combatPower: number;
    ascensionStep: number;
    nightmareLayer: number;
    buildId: string | null;
    gear: Partial<Record<string, { name?: string; itemLevel?: number; enchant?: number }>>;
    daevanion: Record<string, number>;
    transcendence: Record<string, number>;
    skillLevels: Record<string, number>;
    stigmas: Record<string, number>;
    notes: string;
  };
  builds: { id: string; title: string }[];
  skills: SkillOpt[];
  stigmas: SkillOpt[];
  gearSlots: { slot: string; label: string; target: string | null; options: { name: string; itemLevel: number | null }[] }[];
  transcendence: { slug: string; name: string; stages: number[] }[];
};

const BOARDS = [
  ["nezekan", "Nezekan", 12, 134],
  ["zikel", "Zikel", 20, 134],
  ["vaizel", "Vaizel", 30, 134],
  ["triniel", "Triniel", 40, 168],
  ["azphel", "Azphel", 45, 232],
] as const;

export function ProgressForm(props: ProgressFormProps) {
  const { initial } = props;
  const [state, action, pending] = useActionState(saveProgress.bind(null, props.playerId), null);
  useEffect(() => {
    if (state?.ok) toast.success("État des lieux enregistré", { description: "Les recommandations sont à jour." });
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="gear">Équipement</TabsTrigger>
          <TabsTrigger value="skills">Compétences & stigmas</TabsTrigger>
          <TabsTrigger value="boards">Daevanion & Transcendance</TabsTrigger>
        </TabsList>

        {/* forceMount : les champs des onglets cachés restent dans le formulaire */}
        <TabsContent value="general" forceMount className="data-[state=inactive]:hidden">
          <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
            <Field label="Niveau" name="level" defaultValue={initial.level} min={1} max={60} />
            <Field label="Item level (total)" name="itemLevel" defaultValue={initial.itemLevel} min={0} />
            <Field label="Puissance de combat" name="combatPower" defaultValue={initial.combatPower} min={0} />
            <FormSelect
              label="Quêtes d'Ascension terminées"
              name="ascensionStep"
              defaultValue={String(initial.ascensionStep)}
              options={[0, 1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` }))}
            />
            <FormSelect
              label="Build suivi"
              name="buildId"
              defaultValue={initial.buildId ?? "none"}
              options={[{ value: "none", label: "Aucun" }, ...props.builds.map((b) => ({ value: b.id, label: b.title }))]}
            />
            <Field label="Couche du Cauchemar atteinte" name="nightmare.layer" defaultValue={initial.nightmareLayer} min={0} max={4} />
            <div className="space-y-2 @xl/main:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={initial.notes} placeholder="Objectifs perso, rappels…" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gear" forceMount className="data-[state=inactive]:hidden">
          <p className="text-muted-foreground mb-3 text-sm">Nom de l&apos;objet (autocomplétion depuis le catalogue), son item level et son enchantement.</p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 @4xl/main:grid-cols-2">
            {props.gearSlots.map((g) => {
              const cur = initial.gear[g.slot];
              const listId = `items-${g.slot}`;
              return (
                <div key={g.slot} className="grid grid-cols-[7.5rem_1fr_4.5rem_4rem] items-center gap-2">
                  <Label className="text-xs" htmlFor={`gear-${g.slot}`} title={g.target ? `Objectif du build : ${g.target}` : undefined}>
                    {g.label}
                    {g.target && <span className="text-primary">•</span>}
                  </Label>
                  <Input id={`gear-${g.slot}`} name={`gear.${g.slot}.name`} defaultValue={cur?.name ?? ""} list={listId} placeholder={g.target ?? ""} className="h-8 text-xs" />
                  <datalist id={listId}>
                    {g.options.map((o) => (
                      <option key={o.name + o.itemLevel} value={o.name}>
                        {o.itemLevel ? `IL ${o.itemLevel}` : ""}
                      </option>
                    ))}
                  </datalist>
                  <Input name={`gear.${g.slot}.itemLevel`} type="number" min={0} defaultValue={cur?.itemLevel ?? ""} placeholder="IL" className="h-8 text-xs" />
                  <Input name={`gear.${g.slot}.enchant`} type="number" min={0} max={15} defaultValue={cur?.enchant ?? ""} placeholder="+" className="h-8 text-xs" />
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="skills" forceMount className="space-y-5 data-[state=inactive]:hidden">
          <SkillInputs title="Actifs & passifs (niveau avec les points, 1-10)" prefix="skill" items={props.skills} values={initial.skillLevels} max={10} />
          <SkillInputs title="Stigmas (0 = non équipé)" prefix="stigma" items={props.stigmas} values={initial.stigmas} max={20} />
        </TabsContent>

        <TabsContent value="boards" forceMount className="space-y-5 data-[state=inactive]:hidden">
          <div>
            <p className="mb-2 text-sm font-medium">Points investis par plateau Daevanion</p>
            <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-5">
              {BOARDS.map(([key, name, lvl, total]) => (
                <Field key={key} label={`${name} (niv. ${lvl}, ${total} pts)`} name={`daevanion.${key}`} defaultValue={initial.daevanion[key] ?? ""} min={0} max={total} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Meilleur palier de Transcendance réussi</p>
            <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-3 @4xl/main:grid-cols-5">
              {props.transcendence.map((t) => (
                <FormSelect
                  key={t.slug}
                  label={t.name}
                  name={`transcendence.${t.slug}`}
                  defaultValue={String(initial.transcendence[t.slug] ?? 0)}
                  options={[
                    { value: "0", label: "Aucun" },
                    ...t.stages.map((il, i) => ({ value: String(i + 1), label: `Palier ${i + 1} (IL ${il.toLocaleString("fr-FR")})` })),
                  ]}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer l'état des lieux"}
        </Button>
      </div>
    </form>
  );
}

/** Select shadcn branché sur le formulaire (Radix rend un <select> natif caché portant `name`) */
function FormSelect({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <Label className="text-xs">{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Field({ label, name, defaultValue, min, max }: { label: string; name: string; defaultValue: number | string; min?: number; max?: number }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <Input id={name} name={name} type="number" defaultValue={defaultValue} min={min} max={max} />
    </div>
  );
}

function SkillInputs({ title, prefix, items, values, max }: { title: string; prefix: string; items: SkillOpt[]; values: Record<string, number>; max: number }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="grid grid-cols-1 gap-2 @xl/main:grid-cols-2 @4xl/main:grid-cols-3 @6xl/main:grid-cols-4">
        {items.map((s) => {
          const v = values[String(s.id)];
          const behind = s.target != null && (v ?? 0) < s.target;
          return (
            <label key={s.id} className={cn("flex items-center gap-2 rounded-md border bg-black/15 p-1.5", s.target != null && "border-primary/40")}>
              <GameIcon src={s.icon} alt={s.name} size={30} />
              <span className="min-w-0 flex-1 truncate text-xs" title={s.name}>
                {s.name}
                {s.target != null && <span className={cn("block text-[10px]", behind ? "text-amber-400" : "text-success")}>build : niv. {s.target}</span>}
              </span>
              <Input name={`${prefix}.${s.id}`} type="number" min={0} max={max} defaultValue={v ?? ""} className="h-7 w-14 text-xs" />
            </label>
          );
        })}
      </div>
    </div>
  );
}
