import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calcNetCarbs, calcSkaldemanRatio } from "@/lib/calculations";

const mealEntrySchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  productName: z.string().optional(),
  barcode: z.string().optional(),
  portionGrams: z.number().min(0).optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  carbs: z.number().min(0),
  fiber: z.number().min(0),
  date: z.string().optional(), // YYYY-MM-DD, defaults to today
});

function getUserId(session: { user?: { id?: string } }): string | null {
  return (session.user as { id: string })?.id ?? null;
}

async function recalcDayTotals(nutritionDayId: string) {
  const meals = await prisma.mealEntry.findMany({
    where: { nutritionDayId },
  });

  const totals = meals.reduce(
    (acc, m) => ({
      totalCalories: acc.totalCalories + m.calories,
      totalProtein: acc.totalProtein + m.protein,
      totalFat: acc.totalFat + m.fat,
      totalCarbs: acc.totalCarbs + m.carbs,
      totalFiber: acc.totalFiber + m.fiber,
    }),
    { totalCalories: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0, totalFiber: 0 }
  );

  const totalNetCarbs = calcNetCarbs(totals.totalCarbs, totals.totalFiber);
  const skaldemanRatio = calcSkaldemanRatio(totals.totalFat, totals.totalProtein, totalNetCarbs);

  await prisma.nutritionDay.update({
    where: { id: nutritionDayId },
    data: {
      ...totals,
      totalNetCarbs,
      skaldemanRatio,
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const days = await prisma.nutritionDay.findMany({
    where: {
      userId,
      date: { gte: thirtyDaysAgo },
    },
    include: {
      meals: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(days);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = mealEntrySchema.parse(body);

    const dateStr = data.date || new Date().toISOString().split("T")[0];
    const dayDate = new Date(dateStr + "T00:00:00.000Z");

    // Find or create the NutritionDay
    let nutritionDay = await prisma.nutritionDay.findUnique({
      where: {
        userId_date: {
          userId,
          date: dayDate,
        },
      },
    });

    if (!nutritionDay) {
      nutritionDay = await prisma.nutritionDay.create({
        data: {
          userId,
          date: dayDate,
        },
      });
    }

    const netCarbs = calcNetCarbs(data.carbs, data.fiber);

    // Create the meal entry
    const meal = await prisma.mealEntry.create({
      data: {
        nutritionDayId: nutritionDay.id,
        mealType: data.mealType,
        productName: data.productName,
        barcode: data.barcode,
        portionGrams: data.portionGrams,
        calories: data.calories,
        protein: data.protein,
        fat: data.fat,
        carbs: data.carbs,
        fiber: data.fiber,
        netCarbs,
      },
    });

    // Recalculate day totals
    await recalcDayTotals(nutritionDay.id);

    // Return the updated day with meals
    const updatedDay = await prisma.nutritionDay.findUnique({
      where: { id: nutritionDay.id },
      include: { meals: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({ meal, day: updatedDay }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Nutrition POST error:", error);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export { recalcDayTotals };
