"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "measurements" | "vitals" | "nutrition";

export default function TrackPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("measurements");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Measurements form
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [thigh, setThigh] = useState("");
  const [arm, setArm] = useState("");

  // Vitals form
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bloodGlucose, setBloodGlucose] = useState("");
  const [bloodKetones, setBloodKetones] = useState("");
  const [urineKetones, setUrineKetones] = useState("");

  // Nutrition form
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fiber, setFiber] = useState("");

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  };

  const saveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: parseFloat(weight),
          waist: waist ? parseFloat(waist) : undefined,
          thigh: thigh ? parseFloat(thigh) : undefined,
          arm: arm ? parseFloat(arm) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Messung gespeichert! ✅");
      setWeight(""); setWaist(""); setThigh(""); setArm("");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Fehler", true);
    }
    setSaving(false);
  };

  const saveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systolic: systolic ? parseInt(systolic) : undefined,
          diastolic: diastolic ? parseInt(diastolic) : undefined,
          bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : undefined,
          bloodKetones: bloodKetones ? parseFloat(bloodKetones) : undefined,
          urineKetones: urineKetones ? parseFloat(urineKetones) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Vitalwerte gespeichert! ✅");
      setSystolic(""); setDiastolic(""); setBloodGlucose(""); setBloodKetones(""); setUrineKetones("");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Fehler", true);
    }
    setSaving(false);
  };

  const saveNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calories: parseFloat(calories),
          protein: parseFloat(protein),
          fat: parseFloat(fat),
          carbs: parseFloat(carbs),
          fiber: parseFloat(fiber),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Ernährungsdaten gespeichert! ✅");
      setCalories(""); setProtein(""); setFat(""); setCarbs(""); setFiber("");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Fehler", true);
    }
    setSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "measurements", label: "Körpermaße", icon: "⚖️" },
    { id: "vitals", label: "Vitalwerte", icon: "❤️" },
    { id: "nutrition", label: "Ernährung", icon: "🥑" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">📝 Daten erfassen</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

      {/* Measurements Form */}
      {activeTab === "measurements" && (
        <Card>
          <CardHeader>
            <CardTitle>⚖️ Körpermaße</CardTitle>
            <CardDescription>Gewicht ist Pflicht, Umfänge sind optional</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveMeasurement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Gewicht (kg) *</Label>
                <Input id="weight" type="number" step="0.1" placeholder="z.B. 85.5" value={weight} onChange={(e) => setWeight(e.target.value)} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waist">Bauchumfang (cm)</Label>
                  <Input id="waist" type="number" step="0.5" placeholder="z.B. 95" value={waist} onChange={(e) => setWaist(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thigh">Beinumfang (cm)</Label>
                  <Input id="thigh" type="number" step="0.5" placeholder="z.B. 58" value={thigh} onChange={(e) => setThigh(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arm">Armumfang (cm)</Label>
                  <Input id="arm" type="number" step="0.5" placeholder="z.B. 35" value={arm} onChange={(e) => setArm(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Speichern..." : "Messung speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vitals Form */}
      {activeTab === "vitals" && (
        <Card>
          <CardHeader>
            <CardTitle>❤️ Vitalwerte</CardTitle>
            <CardDescription>Alle Felder sind optional - trage ein, was du gemessen hast</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic">Systolisch (mmHg)</Label>
                  <Input id="systolic" type="number" placeholder="z.B. 120" value={systolic} onChange={(e) => setSystolic(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic">Diastolisch (mmHg)</Label>
                  <Input id="diastolic" type="number" placeholder="z.B. 80" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGlucose">Blutzucker (mg/dl)</Label>
                <Input id="bloodGlucose" type="number" step="0.1" placeholder="z.B. 85" value={bloodGlucose} onChange={(e) => setBloodGlucose(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodKetones">Blutketone (mmol/L)</Label>
                  <Input id="bloodKetones" type="number" step="0.1" placeholder="z.B. 1.5" value={bloodKetones} onChange={(e) => setBloodKetones(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urineKetones">Urinketone (mg/dl)</Label>
                  <Input id="urineKetones" type="number" step="0.1" placeholder="z.B. 40" value={urineKetones} onChange={(e) => setUrineKetones(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Speichern..." : "Vitalwerte speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Nutrition Form */}
      {activeTab === "nutrition" && (
        <Card>
          <CardHeader>
            <CardTitle>🥑 Ernährung</CardTitle>
            <CardDescription>Trage deine täglichen Makronährstoffe ein</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveNutrition} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Kalorien (kcal) *</Label>
                <Input id="calories" type="number" placeholder="z.B. 1800" value={calories} onChange={(e) => setCalories(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g) *</Label>
                  <Input id="protein" type="number" step="0.1" placeholder="z.B. 120" value={protein} onChange={(e) => setProtein(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fett (g) *</Label>
                  <Input id="fat" type="number" step="0.1" placeholder="z.B. 140" value={fat} onChange={(e) => setFat(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carbs">Kohlenhydrate gesamt (g) *</Label>
                  <Input id="carbs" type="number" step="0.1" placeholder="z.B. 30" value={carbs} onChange={(e) => setCarbs(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiber">Ballaststoffe (g) *</Label>
                  <Input id="fiber" type="number" step="0.1" placeholder="z.B. 15" value={fiber} onChange={(e) => setFiber(e.target.value)} required />
                </div>
              </div>
              {carbs && fiber && (
                <div className="bg-green-50 p-3 rounded-md text-sm">
                  <strong>Netto-Carbs:</strong> {Math.max(0, parseFloat(carbs) - parseFloat(fiber)).toFixed(1)}g
                  {parseFloat(carbs) - parseFloat(fiber) <= 20 && " 🟢 Tiefe Ketose"}
                  {parseFloat(carbs) - parseFloat(fiber) > 20 && parseFloat(carbs) - parseFloat(fiber) <= 30 && " 🟡 Ketose"}
                  {parseFloat(carbs) - parseFloat(fiber) > 30 && parseFloat(carbs) - parseFloat(fiber) <= 50 && " 🟠 Grenzbereich"}
                  {parseFloat(carbs) - parseFloat(fiber) > 50 && " 🔴 Keine Ketose"}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Speichern..." : "Ernährungsdaten speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
