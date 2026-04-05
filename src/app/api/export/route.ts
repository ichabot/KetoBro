import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      height: true,
      gender: true,
      birthDate: true,
      activityLevel: true,
      goalWeight: true,
      goalCalories: true,
      goalNetCarbs: true,
      goalProtein: true,
    },
  });

  const measurements = await prisma.measurement.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true, weight: true, waist: true, thigh: true, arm: true },
  });

  const vitals = await prisma.vitals.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    select: { timestamp: true, systolic: true, diastolic: true, bloodGlucose: true, bloodKetones: true, urineKetones: true },
  });

  const nutritionDays = await prisma.nutritionDay.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: { meals: true },
  });

  if (format === "csv") {
    let csv = "=== PROFIL ===\n";
    csv += `Name,Email,Größe,Geschlecht,Aktivitätslevel,Zielgewicht,Ziel-Kalorien,Max-NetCarbs,Ziel-Protein\n`;
    csv += `${user?.name || ""},${user?.email || ""},${user?.height || ""},${user?.gender || ""},${user?.activityLevel || ""},${user?.goalWeight || ""},${user?.goalCalories || ""},${user?.goalNetCarbs || ""},${user?.goalProtein || ""}\n\n`;

    csv += "=== MESSUNGEN ===\n";
    csv += "Datum,Gewicht(kg),Bauch(cm),Bein(cm),Arm(cm)\n";
    for (const m of measurements) {
      csv += `${new Date(m.date).toISOString().split("T")[0]},${m.weight},${m.waist || ""},${m.thigh || ""},${m.arm || ""}\n`;
    }

    csv += "\n=== VITALWERTE ===\n";
    csv += "Zeitstempel,Systolisch,Diastolisch,Blutzucker,Blutketone,Urinketone\n";
    for (const v of vitals) {
      csv += `${new Date(v.timestamp).toISOString()},${v.systolic || ""},${v.diastolic || ""},${v.bloodGlucose || ""},${v.bloodKetones || ""},${v.urineKetones || ""}\n`;
    }

    csv += "\n=== ERNÄHRUNG ===\n";
    csv += "Datum,Kalorien,Protein,Fett,Kohlenhydrate,Ballaststoffe,NettoCarbs,SkaldemanRatio,Mahlzeiten\n";
    for (const d of nutritionDays) {
      csv += `${new Date(d.date).toISOString().split("T")[0]},${d.totalCalories},${d.totalProtein},${d.totalFat},${d.totalCarbs},${d.totalFiber},${d.totalNetCarbs},${d.skaldemanRatio || ""},${d.meals.length}\n`;
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ketobro-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // JSON format
  const data = {
    exportDate: new Date().toISOString(),
    profile: user,
    measurements,
    vitals,
    nutritionDays: nutritionDays.map((d) => ({
      date: d.date,
      totalCalories: d.totalCalories,
      totalProtein: d.totalProtein,
      totalFat: d.totalFat,
      totalCarbs: d.totalCarbs,
      totalFiber: d.totalFiber,
      totalNetCarbs: d.totalNetCarbs,
      skaldemanRatio: d.skaldemanRatio,
      meals: d.meals.map((m) => ({
        mealType: m.mealType,
        productName: m.productName,
        portionGrams: m.portionGrams,
        calories: m.calories,
        protein: m.protein,
        fat: m.fat,
        carbs: m.carbs,
        fiber: m.fiber,
        netCarbs: m.netCarbs,
      })),
    })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ketobro-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
