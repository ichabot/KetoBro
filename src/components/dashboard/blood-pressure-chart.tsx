"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: Array<{ timestamp: string; systolic: number | null; diastolic: number | null }>;
}

export function BloodPressureChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.systolic && d.diastolic)
    .map((d) => ({
      date: new Date(d.timestamp).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
      systolisch: d.systolic,
      diastolisch: d.diastolic,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} unit=" mmHg" />
        <Tooltip formatter={(value: any, name: any) => [`${value} mmHg`, name === "systolisch" ? "Systolisch" : "Diastolisch"]} />
        <Legend />
        <Line type="monotone" dataKey="systolisch" stroke="#ef4444" strokeWidth={2} />
        <Line type="monotone" dataKey="diastolisch" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
