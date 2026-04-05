"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goalWeight, setGoalWeight] = useState("");
  const [goalCalories, setGoalCalories] = useState("");
  const [goalNetCarbs, setGoalNetCarbs] = useState("");
  const [goalProtein, setGoalProtein] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => {
        setGoalWeight(data.goalWeight?.toString() || "");
        setGoalCalories(data.goalCalories?.toString() || "");
        setGoalNetCarbs(data.goalNetCarbs?.toString() || "");
        setGoalProtein(data.goalProtein?.toString() || "");
      })
      .finally(() => setLoading(false));
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalWeight: goalWeight || null,
          goalCalories: goalCalories || null,
          goalNetCarbs: goalNetCarbs || null,
          goalProtein: goalProtein || null,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      setMessage("Ziele gespeichert! ✅");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler beim Speichern");
    }
    setSaving(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-bounce">🎯</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🎯 Ziele</h1>

      {message && (
        <div className={`p-3 rounded-md mb-4 text-sm ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deine Keto-Ziele</CardTitle>
          <CardDescription>
            Setze deine persönlichen Tagesziele. Diese werden in der Tagesübersicht als Fortschrittsbalken angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="goalWeight">Zielgewicht (kg)</Label>
              <Input
                id="goalWeight"
                type="number"
                step="0.1"
                placeholder="z.B. 75"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
              />
              <p className="text-xs text-gray-400">Dein angestrebtes Körpergewicht</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalCalories">Tagesziel Kalorien (kcal)</Label>
              <Input
                id="goalCalories"
                type="number"
                placeholder="z.B. 1800"
                value={goalCalories}
                onChange={(e) => setGoalCalories(e.target.value)}
              />
              <p className="text-xs text-gray-400">Empfohlen: TDEE minus 300-500 kcal für Gewichtsabnahme</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalNetCarbs">Max. Netto-Carbs pro Tag (g)</Label>
              <Input
                id="goalNetCarbs"
                type="number"
                placeholder="z.B. 20"
                value={goalNetCarbs}
                onChange={(e) => setGoalNetCarbs(e.target.value)}
              />
              <p className="text-xs text-gray-400">Für Ketose: 20g (strikt) bis 50g (moderat)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalProtein">Protein-Ziel pro Tag (g)</Label>
              <Input
                id="goalProtein"
                type="number"
                placeholder="z.B. 120"
                value={goalProtein}
                onChange={(e) => setGoalProtein(e.target.value)}
              />
              <p className="text-xs text-gray-400">Empfohlen: 1.2-2.0g pro kg Körpergewicht</p>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Speichern..." : "Ziele speichern"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick info card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">💡 Keto-Richtwerte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-800">🟢 Strenge Keto</div>
              <div className="text-green-700">≤ 20g Netto-Carbs</div>
              <div className="text-green-600 text-xs mt-1">70% Fett, 25% Protein, 5% Carbs</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="font-semibold text-yellow-800">🟡 Moderate Keto</div>
              <div className="text-yellow-700">20-30g Netto-Carbs</div>
              <div className="text-yellow-600 text-xs mt-1">65% Fett, 25% Protein, 10% Carbs</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="font-semibold text-orange-800">🟠 Liberal Keto</div>
              <div className="text-orange-700">30-50g Netto-Carbs</div>
              <div className="text-orange-600 text-xs mt-1">60% Fett, 25% Protein, 15% Carbs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
