"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProgressChart({ data }: { data: { day: string; itemLevel: number; combatPower: number }[] }) {
  if (data.length < 2)
    return <p className="text-muted-foreground text-sm">La courbe apparaîtra après quelques mises à jour (un point par jour).</p>;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data.map((d) => ({ ...d, day: d.day.slice(5) }))} margin={{ left: -10, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis yAxisId="il" stroke="var(--chart-1)" fontSize={11} />
          <YAxis yAxisId="cp" orientation="right" stroke="var(--chart-2)" fontSize={11} />
          <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line yAxisId="il" type="monotone" dataKey="itemLevel" name="Item level" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
          <Line yAxisId="cp" type="monotone" dataKey="combatPower" name="Puissance" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
