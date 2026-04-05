"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Tab = "measurements" | "vitals" | "nutrition";

interface MeasurementEntry {
  id: string;
  date: string;
  weight: number;
  waist: number | null;
  thigh: number | null;
  arm: number | null;
}

interface VitalEntry {
  id: string;
  timestamp: string;
  systolic: number | null;
  diastolic: number | null;
  bloodGlucose: number | null;
  bloodKetones: number | null;
}

interface NutritionEntry {
  id: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalNetCarbs: number;
  meals?: { id: string }[];
  _count?: { meals: number };
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("measurements");
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [vitals, setVitals] = useState<VitalEntry[]>([]);
  const [nutrition, setNutrition] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const [mRes, vRes, nRes] = await Promise.all([
          fetch("/api/measurements?limit=100"),
          fetch("/api/vitals?limit=100"),
          fetch("/api/nutrition/days?limit=100"),
        ]);
        const [mData, vData, nData] = await Promise.all([mRes.json(), vRes.json(), nRes.json()]);
        setMeasurements(Array.isArray(mData) ? mData : []);
        setVitals(Array.isArray(vData) ? vData : []);
        setNutrition(Array.isArray(nData) ? nData : []);
      } catch {
        // ignore
      }
      setLoading(false);
    };
    fetchAll();
  }, [session]);

  const deleteMeasurement = async (id: string) => {
    if (!confirm("Eintrag wirklich löschen?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/measurements/${id}`, { method: "DELETE" });
      if (res.ok) setMeasurements((prev) => prev.filter((m) => m.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const deleteVital = async (id: string) => {
    if (!confirm("Eintrag wirklich löschen?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/vitals/${id}`, { method: "DELETE" });
      if (res.ok) setVitals((prev) => prev.filter((v) => v.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const deleteNutritionDay = async (id: string) => {
    if (!confirm("Gesamten Tag wirklich löschen?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/nutrition/days/${id}`, { method: "DELETE" });
      if (res.ok) setNutrition((prev) => prev.filter((n) => n.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtDateTime = (d: string) => new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "measurements", label: "⚖️ Messungen", count: measurements.length },
    { id: "vitals", label: "❤️ Vitalwerte", count: vitals.length },
    { id: "nutrition", label: "🍎 Ernährung", count: nutrition.length },
  ];

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-bounce">📋</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">📋 Verlauf</h1>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Measurements */}
      {activeTab === "measurements" && (
        <div className="space-y-3">
          {measurements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                Noch keine Messungen vorhanden
              </CardContent>
            </Card>
          ) : (
            measurements.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{fmtDate(m.date)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-semibold">{m.weight} kg</span>
                        {m.waist && <span className="ml-3">Bauch: {m.waist} cm</span>}
                        {m.thigh && <span className="ml-3">Bein: {m.thigh} cm</span>}
                        {m.arm && <span className="ml-3">Arm: {m.arm} cm</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => deleteMeasurement(m.id)}
                      disabled={deleting === m.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                    >
                      {deleting === m.id ? "..." : "🗑️"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Vitals */}
      {activeTab === "vitals" && (
        <div className="space-y-3">
          {vitals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                Noch keine Vitalwerte vorhanden
              </CardContent>
            </Card>
          ) : (
            vitals.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{fmtDateTime(v.timestamp)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-x-3">
                        {v.systolic && v.diastolic && <span>🩸 {v.systolic}/{v.diastolic} mmHg</span>}
                        {v.bloodGlucose && <span>💉 {v.bloodGlucose} mg/dl</span>}
                        {v.bloodKetones && <span>🔬 {v.bloodKetones} mmol/L</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => deleteVital(v.id)}
                      disabled={deleting === v.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                    >
                      {deleting === v.id ? "..." : "🗑️"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Nutrition */}
      {activeTab === "nutrition" && (
        <div className="space-y-3">
          {nutrition.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                Noch keine Ernährungsdaten vorhanden
              </CardContent>
            </Card>
          ) : (
            nutrition.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{fmtDate(n.date)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>{Math.round(n.totalCalories)} kcal</span>
                        <span className="ml-3">P: {Math.round(n.totalProtein)}g</span>
                        <span className="ml-3">F: {Math.round(n.totalFat)}g</span>
                        <span className="ml-3">NC: {Math.round(n.totalNetCarbs)}g</span>
                        {(n.meals || n._count) && (
                          <span className="ml-3 text-gray-400 dark:text-gray-500">
                            ({n.meals?.length || n._count?.meals || 0} Mahlzeiten)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/nutrition?date=${n.date.split("T")[0]}`)}
                        className="h-8 px-2 text-xs"
                      >
                        👁️
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => deleteNutritionDay(n.id)}
                        disabled={deleting === n.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                      >
                        {deleting === n.id ? "..." : "🗑️"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
