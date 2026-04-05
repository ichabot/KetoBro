"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeightChart } from "@/components/dashboard/weight-chart";
import { BodyMeasurementsChart } from "@/components/dashboard/body-measurements-chart";
import { MacrosPieChart } from "@/components/dashboard/macros-pie-chart";
import { NetCarbsChart } from "@/components/dashboard/net-carbs-chart";
import { BloodPressureChart } from "@/components/dashboard/blood-pressure-chart";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  user: { name: string | null; height: number | null; gender: string | null; activityLevel: string | null };
  measurements: Array<{ date: string; weight: number; waist: number | null; thigh: number | null; arm: number | null }>;
  vitals: Array<{ timestamp: string; systolic: number | null; diastolic: number | null; bloodGlucose: number | null; bloodKetones: number | null }>;
  nutrition: Array<{ date: string; calories: number; protein: number; fat: number; carbs: number; fiber: number; netCarbs: number; skaldemanRatio: number | null }>;
  stats: {
    currentWeight: number | null;
    weightChange: number | null;
    startWeight: number | null;
    bmr: number | null;
    tdee: number | null;
    age: number | null;
    ketosisStatus: { status: string; color: string; emoji: string } | null;
    skaldemanStatus: { status: string; color: string } | null;
    weeklyAvg: {
      calories: number;
      protein: number;
      fat: number;
      netCarbs: number;
      skaldemanRatio: number | null;
    } | null;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🥑</div>
          <p className="text-gray-500">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Hallo{data.user.name ? `, ${data.user.name}` : ""}! 🥑
        </h1>
        <p className="text-gray-500 mt-1">Dein KetoBro Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Aktuelles Gewicht</div>
            <div className="text-2xl font-bold">
              {stats.currentWeight ? `${stats.currentWeight} kg` : "—"}
            </div>
            {stats.weightChange !== null && (
              <div className={`text-sm mt-1 ${stats.weightChange < 0 ? "text-green-600" : stats.weightChange > 0 ? "text-red-600" : "text-gray-500"}`}>
                {stats.weightChange > 0 ? "+" : ""}{stats.weightChange} kg seit Start
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Ketose-Status</div>
            <div className="text-2xl font-bold">
              {stats.ketosisStatus ? `${stats.ketosisStatus.emoji} ${stats.ketosisStatus.status}` : "—"}
            </div>
            {stats.weeklyAvg && (
              <div className="text-sm text-gray-500 mt-1">
                Ø {stats.weeklyAvg.netCarbs}g Netto-Carbs/Tag
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Skaldeman Ratio</div>
            <div className="text-2xl font-bold">
              {stats.weeklyAvg?.skaldemanRatio ?? "—"}
            </div>
            {stats.skaldemanStatus && (
              <Badge variant={stats.skaldemanStatus.color.includes("green") ? "default" : stats.skaldemanStatus.color.includes("yellow") ? "warning" : "secondary"}>
                {stats.skaldemanStatus.status}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-1">Grundumsatz</div>
            <div className="text-2xl font-bold">
              {stats.bmr ? `${stats.bmr} kcal` : "—"}
            </div>
            {stats.tdee && (
              <div className="text-sm text-gray-500 mt-1">
                TDEE: {stats.tdee} kcal
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.measurements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚖️ Gewichtsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightChart data={data.measurements} />
            </CardContent>
          </Card>
        )}

        {data.measurements.some(m => m.waist || m.thigh || m.arm) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📏 Körpermaße</CardTitle>
            </CardHeader>
            <CardContent>
              <BodyMeasurementsChart data={data.measurements} />
            </CardContent>
          </Card>
        )}

        {stats.weeklyAvg && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🥧 Makronährstoff-Verteilung (Ø 7 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
              <MacrosPieChart data={stats.weeklyAvg} />
            </CardContent>
          </Card>
        )}

        {data.nutrition.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🥦 Netto-Carbs pro Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <NetCarbsChart data={data.nutrition} />
            </CardContent>
          </Card>
        )}

        {data.vitals.some(v => v.systolic && v.diastolic) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">❤️ Blutdruck-Verlauf</CardTitle>
            </CardHeader>
            <CardContent>
              <BloodPressureChart data={data.vitals} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {data.measurements.length === 0 && data.nutrition.length === 0 && (
        <Card className="mt-8">
          <CardContent className="p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">Noch keine Daten vorhanden</h3>
            <p className="text-gray-500 mb-4">
              Starte jetzt mit dem Tracking deiner Körpermaße und Ernährung!
            </p>
            <a href="/track" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Daten erfassen →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
