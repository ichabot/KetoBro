import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calcNetCarbs, calcSkaldemanRatio } from "@/lib/calculations";

const nutritionSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  carbs: z.number().min(0),
  fiber: z.number().min(0),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "30");

  const nutrition = await prisma.nutritionLog.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(nutrition);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = nutritionSchema.parse(body);

    const netCarbs = calcNetCarbs(data.carbs, data.fiber);
    const skaldemanRatio = calcSkaldemanRatio(data.fat, data.protein, netCarbs);

    const dateStr = data.date || new Date().toISOString().split("T")[0];

    const nutrition = await prisma.nutritionLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        calories: data.calories,
        protein: data.protein,
        fat: data.fat,
        carbs: data.carbs,
        fiber: data.fiber,
        netCarbs,
        skaldemanRatio,
        date: new Date(dateStr),
        source: "manual",
      },
    });

    return NextResponse.json(nutrition, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
