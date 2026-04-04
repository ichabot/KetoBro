"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Props {
  data: Array<{ date: string; netCarbs: number }>;
}

export function NetCarbsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    nettoCarbs: d.netCarbs,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} unit="g" />
        <Tooltip formatter={(value: any) => [`${value}g`, "Netto-Carbs"]} />
        <ReferenceLine y={20} stroke="#16a34a" strokeDasharray="5 5" label={{ value: "20g Ziel", position: "right", fontSize: 11 }} />
        <Bar
          dataKey="nettoCarbs"
          fill="#16a34a"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
