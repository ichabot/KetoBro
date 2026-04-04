"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: Array<{ date: string; weight: number }>;
}

export function WeightChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    gewicht: d.weight,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis domain={["dataMin - 2", "dataMax + 2"]} fontSize={12} unit=" kg" />
        <Tooltip formatter={(value: any) => [`${value} kg`, "Gewicht"]} />
        <Line type="monotone" dataKey="gewicht" stroke="#16a34a" strokeWidth={2} dot={{ fill: "#16a34a", r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
