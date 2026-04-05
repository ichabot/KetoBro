"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Meal {
  id: string;
  mealType: string;
  productName: string | null;
  portionGrams: number | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  netCarbs: number;
}

interface DayData {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalNetCarbs: number;
  totalCarbs: number;
  totalFiber: number;
  skaldemanRatio: number | null;
  meals: Meal[];
}

interface Goals {
  goalCalories: number | null;
  goalNetCarbs: number | null;
  goalProtein: number | null;
}

const MEAL_TYPES: Record<string, string> = {
  breakfast: "🌅 Frühstück",
  lunch: "☀️ Mittagessen",
  dinner: "🌙 Abendessen",
  snack: "🍿 Snacks",
};

function getKetoseStatus(netCarbs: number): { label: string; color: string; emoji: string } {
  if (netCarbs <= 20) return { label: "Tiefe Ketose", color: "bg-green-500", emoji: "🟢" };
  if (netCarbs <= 30) return { label: "Ketose", color: "bg-lime-500", emoji: "🟡" };
  if (netCarbs <= 50) return { label: "Grenzbereich", color: "bg-yellow-500", emoji: "🟠" };
  return { label: "Keine Ketose", color: "bg-red-500", emoji: "🔴" };
}

function ProgressBar({ value, max, label, unit }: { value: number; max: number; label: string; unit: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const over = value > max;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={over ? "text-red-600 font-semibold" : "text-gray-700"}>
          {Math.round(value)} / {max} {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [day, setDay] = useState<DayData | null>(null);
  const [goals, setGoals] = useState<Goals | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nutrition/day?date=${date}`);
      const data = await res.json();
      setDay(data.day);
      setGoals(data.goals);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split("T")[0]);
  };

  const isToday = date === new Date().toISOString().split("T")[0];

  const deleteMeal = async (mealId: string) => {
    if (!confirm("Mahlzeit wirklich löschen?")) return;
    setDeleting(mealId);
    try {
      const res = await fetch(`/api/nutrition/${mealId}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch {
      // ignore
    }
    setDeleting(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const mealsByType = (type: string) => day?.meals.filter((m) => m.mealType === type) || [];

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-bounce">🥑</div>
      </div>
    );
  }

  const ketose = day ? getKetoseStatus(day.totalNetCarbs) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🍽️ Tagesübersicht</h1>

      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-lg border p-3">
        <Button variant="outline" onClick={() => changeDate(-1)}>← Vorher</Button>
        <div className="text-center">
          <div className="font-semibold text-lg">{formatDate(date)}</div>
          {isToday && <Badge variant="default">Heute</Badge>}
        </div>
        <Button variant="outline" onClick={() => changeDate(1)} disabled={isToday}>Nächster →</Button>
      </div>

      {/* Summary */}
      {day ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">📊 Tageszusammenfassung</CardTitle>
                {ketose && (
                  <Badge className={`${ketose.color} text-white`}>
                    {ketose.emoji} {ketose.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{Math.round(day.totalCalories)}</div>
                  <div className="text-xs text-gray-500">kcal</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold">{Math.round(day.totalProtein)}g</div>
                  <div className="text-xs text-gray-500">Protein</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold">{Math.round(day.totalFat)}g</div>
                  <div className="text-xs text-gray-500">Fett</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold">{Math.round(day.totalNetCarbs)}g</div>
                  <div className="text-xs text-gray-500">Netto-Carbs</div>
                </div>
              </div>

              {/* Progress bars if goals set */}
              {goals && (goals.goalCalories || goals.goalNetCarbs || goals.goalProtein) && (
                <div className="space-y-3 pt-2 border-t">
                  {goals.goalCalories && (
                    <ProgressBar value={day.totalCalories} max={goals.goalCalories} label="Kalorien" unit="kcal" />
                  )}
                  {goals.goalProtein && (
                    <ProgressBar value={day.totalProtein} max={goals.goalProtein} label="Protein" unit="g" />
                  )}
                  {goals.goalNetCarbs && (
                    <ProgressBar value={day.totalNetCarbs} max={goals.goalNetCarbs} label="Netto-Carbs" unit="g" />
                  )}
                </div>
              )}

              {day.skaldemanRatio !== null && (
                <div className="mt-3 text-sm text-gray-500">
                  Skaldeman Ratio: <strong>{day.skaldemanRatio.toFixed(2)}</strong>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meals by type */}
          {Object.entries(MEAL_TYPES).map(([type, label]) => {
            const meals = mealsByType(type);
            if (meals.length === 0) return null;
            return (
              <Card key={type} className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {meals.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {meal.productName || "Manueller Eintrag"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {meal.portionGrams ? `${meal.portionGrams}g · ` : ""}
                            {Math.round(meal.calories)} kcal · P:{Math.round(meal.protein)}g · F:{Math.round(meal.fat)}g · NC:{Math.round(meal.netCarbs)}g
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => deleteMeal(meal.id)}
                          disabled={deleting === meal.id}
                          className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                        >
                          {deleting === meal.id ? "..." : "🗑️"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">Keine Einträge für diesen Tag</h3>
            <p className="text-gray-500">Erfasse deine erste Mahlzeit!</p>
          </CardContent>
        </Card>
      )}

      {/* Add more button */}
      <div className="text-center mt-6">
        <Button onClick={() => router.push("/track?tab=nutrition")} className="px-8">
          ➕ Mahlzeit hinzufügen
        </Button>
      </div>
    </div>
  );
}
