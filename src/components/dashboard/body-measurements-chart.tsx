"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: Array<{ date: string; waist: number | null; thigh: number | null; arm: number | null }>;
}

export function BodyMeasurementsChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.waist || d.thigh || d.arm)
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      bauch: d.waist,
      bein: d.thigh,
      arm: d.arm,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} unit=" cm" />
        <Tooltip formatter={(value: any, name: any) => [`${value} cm`, name === "bauch" ? "Bauch" : name === "bein" ? "Bein" : "Arm"]} />
        <Legend formatter={(value) => value === "bauch" ? "Bauch" : value === "bein" ? "Bein" : "Arm"} />
        <Line type="monotone" dataKey="bauch" stroke="#f59e0b" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="bein" stroke="#3b82f6" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="arm" stroke="#8b5cf6" strokeWidth={2} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
