import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const nutritionDay = await prisma.nutritionDay.findUnique({
    where: {
      userId_date: {
        userId,
        date: new Date(dateStr),
      },
    },
    include: {
      meals: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const goals = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      goalCalories: true,
      goalNetCarbs: true,
      goalProtein: true,
    },
  });

  return NextResponse.json({
    day: nutritionDay
      ? {
          totalCalories: nutritionDay.totalCalories,
          totalProtein: nutritionDay.totalProtein,
          totalFat: nutritionDay.totalFat,
          totalNetCarbs: nutritionDay.totalNetCarbs,
          totalCarbs: nutritionDay.totalCarbs,
          totalFiber: nutritionDay.totalFiber,
          skaldemanRatio: nutritionDay.skaldemanRatio,
          meals: nutritionDay.meals.map((m) => ({
            id: m.id,
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
        }
      : null,
    goals,
  });
}
