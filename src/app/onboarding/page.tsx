"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const TOTAL_STEPS = 5;

const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calcTdee(weight: string, height: string, birthDate: string, gender: string, activityLevel: string): { bmr: number; tdee: number } | null {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const factor = ACTIVITY_FACTORS[activityLevel];
  if (!w || !h || !birthDate || !gender || !factor) return null;

  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 10 || age > 120) return null;

  const bmr = gender === "female"
    ? 10 * w + 6.25 * h - 5 * age - 161
    : 10 * w + 6.25 * h - 5 * age + 5;

  return { bmr: Math.round(bmr), tdee: Math.round(bmr * factor) };
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Data
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalCalories, setGoalCalories] = useState("");
  const [goalNetCarbs, setGoalNetCarbs] = useState("20");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  const next = () => {
    // When leaving step 2 (body data) → auto-calculate calorie goal
    if (step === 2 && !goalCalories) {
      const result = calcTdee(weight, height, birthDate, gender, activityLevel);
      if (result) {
        const deficit = Math.round(result.tdee * 0.8); // 20% Defizit
        setGoalCalories(deficit.toString());
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, gender, birthDate, height, weight,
          activityLevel, goalWeight, goalCalories, goalNetCarbs,
        }),
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  const skip = async () => {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.push("/dashboard");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-5xl animate-bounce">🥑</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Progress Bar */}
        {step > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Schritt {step} von {TOTAL_STEPS}</span>
              <button onClick={skip} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                Überspringen →
              </button>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-7xl mb-6">🥑</div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-400 mb-3">
              Willkommen bei KetoBro!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Dein persönlicher Begleiter für die ketogene Ernährung.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mb-8">
              Lass uns in wenigen Schritten dein Profil einrichten, damit KetoBro dir optimal helfen kann.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Fortschritt tracken</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">KI-Coach</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Ziele erreichen</div>
              </div>
            </div>

            <Button onClick={next} className="w-full text-lg h-12">
              Los geht&apos;s! 🚀
            </Button>
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👋</div>
              <h2 className="text-2xl font-bold">Erzähl uns von dir</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Basis für deine Berechnungen</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Wie heißt du?</Label>
                <Input placeholder="Dein Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Geschlecht</Label>
                <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Bitte wählen</option>
                  <option value="male">♂️ Männlich</option>
                  <option value="female">♀️ Weiblich</option>
                  <option value="diverse">⚧️ Divers</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Geburtsdatum</Label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={prev} variant="outline" className="flex-1">← Zurück</Button>
              <Button onClick={next} className="flex-1">Weiter →</Button>
            </div>
          </div>
        )}

        {/* Step 2: Body Stats */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📏</div>
              <h2 className="text-2xl font-bold">Deine Körperdaten</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Für BMR und TDEE Berechnung</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Körpergröße (cm)</Label>
                <Input type="number" placeholder="z.B. 178" value={height} onChange={(e) => setHeight(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Aktuelles Gewicht (kg)</Label>
                <Input type="number" step="0.1" placeholder="z.B. 85.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <p className="text-xs text-gray-400 dark:text-gray-500">Wird als erste Messung gespeichert</p>
              </div>
              <div className="space-y-2">
                <Label>Aktivitätslevel</Label>
                <Select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                  <option value="">Bitte wählen</option>
                  <option value="sedentary">🪑 Sitzend (Bürojob, wenig Bewegung)</option>
                  <option value="light">🚶 Leicht aktiv (1-3x Sport/Woche)</option>
                  <option value="moderate">🏃 Moderat aktiv (3-5x Sport/Woche)</option>
                  <option value="active">💪 Aktiv (6-7x Sport/Woche)</option>
                  <option value="very_active">🔥 Sehr aktiv (2x täglich / körperliche Arbeit)</option>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={prev} variant="outline" className="flex-1">← Zurück</Button>
              <Button onClick={next} className="flex-1">Weiter →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎯</div>
              <h2 className="text-2xl font-bold">Deine Keto-Ziele</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Optional — kannst du später anpassen</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Zielgewicht (kg)</Label>
                <Input type="number" step="0.1" placeholder="z.B. 75" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tägliches Kalorienziel (kcal)</Label>
                <Input type="number" placeholder="z.B. 1800" value={goalCalories} onChange={(e) => setGoalCalories(e.target.value)} />
                {(() => {
                  const result = calcTdee(weight, height, birthDate, gender, activityLevel);
                  if (!result) return null;
                  const deficit = Math.round(result.tdee * 0.8);
                  return (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg space-y-1">
                      <div>📊 Dein Grundumsatz (BMR): <strong>{result.bmr} kcal</strong></div>
                      <div>📊 Gesamtumsatz (TDEE): <strong>{result.tdee} kcal</strong></div>
                      <div>🎯 Mit 20% Defizit: <strong>{deficit} kcal</strong> (Abnehmen)</div>
                      <div className="pt-1 text-gray-400 dark:text-gray-500">Zum Halten: {result.tdee} kcal · Zum Aufbauen: {Math.round(result.tdee * 1.1)} kcal</div>
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-2">
                <Label>Max. Netto-Carbs pro Tag (g)</Label>
                <Input type="number" placeholder="20" value={goalNetCarbs} onChange={(e) => setGoalNetCarbs(e.target.value)} />
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-sm">
                <div className="font-semibold text-green-800 dark:text-green-400 mb-2">💡 Keto-Empfehlung</div>
                <div className="text-gray-600 dark:text-gray-400 space-y-1">
                  <div>🟢 <strong>Streng:</strong> unter 20g Netto-Carbs/Tag</div>
                  <div>🟡 <strong>Moderat:</strong> 20-30g Netto-Carbs/Tag</div>
                  <div>🟠 <strong>Liberal:</strong> 30-50g Netto-Carbs/Tag</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={prev} variant="outline" className="flex-1">← Zurück</Button>
              <Button onClick={next} className="flex-1">Weiter →</Button>
            </div>
          </div>
        )}

        {/* Step 4: Keto Info */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📚</div>
              <h2 className="text-2xl font-bold">Das Wichtigste zu Keto</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Kurz und knapp</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <div className="font-semibold mb-1">🥑 Makro-Verteilung</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">70-75% Fett · 20-25% Protein · 5-10% Carbs</div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="font-semibold mb-1">📊 Skaldeman Ratio</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Fett(g) ÷ (Protein + Netto-Carbs) — Optimal: 1.0-2.0</div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="font-semibold mb-1">⚡ Elektrolyte nicht vergessen!</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Natrium, Kalium, Magnesium — besonders in den ersten 2 Wochen</div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="font-semibold mb-1">🤖 KetoBro hilft dir</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Frag den KI-Chat jederzeit — er kennt deine Daten und gibt personalisierte Tipps</div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={prev} variant="outline" className="flex-1">← Zurück</Button>
              <Button onClick={next} className="flex-1">Weiter →</Button>
            </div>
          </div>
        )}

        {/* Step 5: Ready! */}
        {step === 5 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
            <div className="text-7xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-green-800 dark:text-green-400 mb-3">
              Alles bereit!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {name ? `${name}, d` : "D"}ein KetoBro-Profil ist eingerichtet.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mb-8">
              Starte jetzt mit dem Tracking deiner Ernährung und Körperdaten.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm font-medium">Mahlzeiten erfassen</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Per Suche oder Barcode</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm font-medium">Dashboard checken</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Charts & Fortschritt</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl mb-1">🤖</div>
                <div className="text-sm font-medium">KetoBro fragen</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">KI-Chat nutzen</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl mb-1">⚙️</div>
                <div className="text-sm font-medium">API Key hinterlegen</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Für den KI-Chat</div>
              </div>
            </div>

            <Button onClick={finish} disabled={saving} className="w-full text-lg h-12">
              {saving ? "Wird gespeichert..." : "Zum Dashboard 🚀"}
            </Button>

            <button onClick={prev} className="mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              ← Noch etwas ändern
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
