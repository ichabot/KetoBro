"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Props {
  data: { protein: number; fat: number; netCarbs: number; calories: number };
}

const COLORS = ["#f59e0b", "#16a34a", "#3b82f6"];

export function MacrosPieChart({ data }: Props) {
  const totalGrams = data.protein + data.fat + data.netCarbs;
  if (totalGrams === 0) return <p className="text-gray-400 text-center py-8">Keine Daten</p>;

  const chartData = [
    { name: "Fett", value: data.fat, grams: data.fat, color: "#f59e0b" },
    { name: "Protein", value: data.protein, grams: data.protein, color: "#16a34a" },
    { name: "Netto-Carbs", value: data.netCarbs, grams: data.netCarbs, color: "#3b82f6" },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }: any) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any, name: any) => [`${value}g`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-gray-500 mt-2">
        Ø {data.calories} kcal/Tag
      </div>
    </div>
  );
}
