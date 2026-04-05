import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // This week's data
  const [measurements, nutritionDays, vitals, prevMeasurements, prevNutrition] = await Promise.all([
    prisma.measurement.findMany({
      where: { userId, date: { gte: oneWeekAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.nutritionDay.findMany({
      where: { userId, date: { gte: oneWeekAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.vitals.findMany({
      where: { userId, timestamp: { gte: oneWeekAgo } },
      orderBy: { timestamp: "asc" },
    }),
    // Previous week for comparison
    prisma.measurement.findMany({
      where: { userId, date: { gte: twoWeeksAgo, lt: oneWeekAgo } },
      orderBy: { date: "asc" },
    }),
    prisma.nutritionDay.findMany({
      where: { userId, date: { gte: twoWeeksAgo, lt: oneWeekAgo } },
      orderBy: { date: "asc" },
    }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { goalWeight: true, goalCalories: true, goalNetCarbs: true, goalProtein: true },
  });

  // Calculate averages
  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 10) / 10 : null;

  const thisWeek = {
    daysTracked: nutritionDays.length,
    measurementsCount: measurements.length,
    avgCalories: avg(nutritionDays.map(d => d.totalCalories)),
    avgProtein: avg(nutritionDays.map(d => d.totalProtein)),
    avgFat: avg(nutritionDays.map(d => d.totalFat)),
    avgNetCarbs: avg(nutritionDays.map(d => d.totalNetCarbs)),
    avgSkaldemanRatio: avg(nutritionDays.filter(d => d.skaldemanRatio).map(d => d.skaldemanRatio!)),
    latestWeight: measurements.length > 0 ? measurements[measurements.length - 1].weight : null,
    firstWeight: measurements.length > 0 ? measurements[0].weight : null,
    weightChange: measurements.length >= 2
      ? Math.round((measurements[measurements.length - 1].weight - measurements[0].weight) * 10) / 10
      : null,
    daysInKetosis: nutritionDays.filter(d => d.totalNetCarbs <= 20).length,
    avgSystolic: avg(vitals.filter(v => v.systolic).map(v => v.systolic!)),
    avgDiastolic: avg(vitals.filter(v => v.diastolic).map(v => v.diastolic!)),
  };

  const prevWeek = {
    avgCalories: avg(prevNutrition.map(d => d.totalCalories)),
    avgNetCarbs: avg(prevNutrition.map(d => d.totalNetCarbs)),
    latestWeight: prevMeasurements.length > 0 ? prevMeasurements[prevMeasurements.length - 1].weight : null,
  };

  return NextResponse.json({
    period: {
      from: oneWeekAgo.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    },
    thisWeek,
    prevWeek,
    goals: user,
  });
}
