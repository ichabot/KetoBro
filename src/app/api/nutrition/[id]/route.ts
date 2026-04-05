import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calcNetCarbs } from "@/lib/calculations";
import { recalcDayTotals } from "../route";

const updateMealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  productName: z.string().optional(),
  barcode: z.string().optional(),
  portionGrams: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
});

function getUserId(session: { user?: { id?: string } }): string | null {
  return (session.user as { id: string })?.id ?? null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;

  // Find the meal and verify ownership through NutritionDay
  const meal = await prisma.mealEntry.findUnique({
    where: { id },
    include: { nutritionDay: true },
  });

  if (!meal || meal.nutritionDay.userId !== userId) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const nutritionDayId = meal.nutritionDayId;

  await prisma.mealEntry.delete({ where: { id } });

  // Recalculate day totals
  await recalcDayTotals(nutritionDayId);

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateMealSchema.parse(body);

    // Find the meal and verify ownership
    const meal = await prisma.mealEntry.findUnique({
      where: { id },
      include: { nutritionDay: true },
    });

    if (!meal || meal.nutritionDay.userId !== userId) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.mealType !== undefined) updateData.mealType = data.mealType;
    if (data.productName !== undefined) updateData.productName = data.productName;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.portionGrams !== undefined) updateData.portionGrams = data.portionGrams;
    if (data.calories !== undefined) updateData.calories = data.calories;
    if (data.protein !== undefined) updateData.protein = data.protein;
    if (data.fat !== undefined) updateData.fat = data.fat;
    if (data.carbs !== undefined) updateData.carbs = data.carbs;
    if (data.fiber !== undefined) updateData.fiber = data.fiber;

    // Recalculate netCarbs if carbs or fiber changed
    const newCarbs = data.carbs ?? meal.carbs;
    const newFiber = data.fiber ?? meal.fiber;
    if (data.carbs !== undefined || data.fiber !== undefined) {
      updateData.netCarbs = calcNetCarbs(newCarbs, newFiber);
    }

    const updatedMeal = await prisma.mealEntry.update({
      where: { id },
      data: updateData,
    });

    // Recalculate day totals
    await recalcDayTotals(meal.nutritionDayId);

    return NextResponse.json(updatedMeal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Meal PATCH error:", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
