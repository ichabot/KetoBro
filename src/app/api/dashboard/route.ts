import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcBMR, calcTDEE, calcAge, getKetosisStatus, getSkaldemanStatus } from "@/lib/calculations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const now = new Date();
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [user, measurements, vitals, nutrition, firstMeasurement] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.measurement.findMany({
      where: { userId, date: { gte: twelveWeeksAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.vitals.findMany({
      where: { userId, timestamp: { gte: twelveWeeksAgo } },
      orderBy: { timestamp: "asc" },
    }),
    prisma.nutritionLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.measurement.findFirst({
      where: { userId },
      orderBy: { date: "asc" },
    }),
  ]);

  const latestMeasurement = measurements[measurements.length - 1];
  const latestNutrition = nutrition[nutrition.length - 1];

  // Calculations
  let bmr: number | null = null;
  let tdee: number | null = null;
  let age: number | null = null;

  if (user?.birthDate) age = calcAge(new Date(user.birthDate));
  if (user?.height && latestMeasurement?.weight && age && user?.gender) {
    bmr = calcBMR(latestMeasurement.weight, user.height, age, user.gender);
    if (user.activityLevel) tdee = calcTDEE(bmr, user.activityLevel);
  }

  const weightChange = latestMeasurement && firstMeasurement
    ? Math.round((latestMeasurement.weight - firstMeasurement.weight) * 10) / 10
    : null;

  // Weekly averages
  const weeklyAvg = nutrition.length > 0 ? {
    calories: Math.round(nutrition.reduce((s, n) => s + n.calories, 0) / nutrition.length),
    protein: Math.round(nutrition.reduce((s, n) => s + n.protein, 0) / nutrition.length),
    fat: Math.round(nutrition.reduce((s, n) => s + n.fat, 0) / nutrition.length),
    netCarbs: Math.round(nutrition.reduce((s, n) => s + n.netCarbs, 0) / nutrition.length * 10) / 10,
    skaldemanRatio: nutrition.filter(n => n.skaldemanRatio).length > 0
      ? Math.round(nutrition.filter(n => n.skaldemanRatio).reduce((s, n) => s + (n.skaldemanRatio || 0), 0) / nutrition.filter(n => n.skaldemanRatio).length * 100) / 100
      : null,
  } : null;

  const ketosisStatus = latestNutrition ? getKetosisStatus(latestNutrition.netCarbs) : null;
  const skaldemanStatus = weeklyAvg?.skaldemanRatio ? getSkaldemanStatus(weeklyAvg.skaldemanRatio) : null;

  return NextResponse.json({
    user: { name: user?.name, height: user?.height, gender: user?.gender, activityLevel: user?.activityLevel },
    measurements,
    vitals,
    nutrition,
    stats: {
      currentWeight: latestMeasurement?.weight || null,
      weightChange,
      startWeight: firstMeasurement?.weight || null,
      bmr: bmr ? Math.round(bmr) : null,
      tdee,
      age,
      ketosisStatus,
      skaldemanStatus,
      weeklyAvg,
    },
  });
}
