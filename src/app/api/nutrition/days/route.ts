import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "30");

  const days = await prisma.nutritionDay.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      _count: {
        select: { meals: true },
      },
    },
  });

  return NextResponse.json(
    days.map((d) => ({
      id: d.id,
      date: d.date.toISOString(),
      totalCalories: d.totalCalories,
      totalProtein: d.totalProtein,
      totalFat: d.totalFat,
      totalNetCarbs: d.totalNetCarbs,
      totalCarbs: d.totalCarbs,
      totalFiber: d.totalFiber,
      _count: d._count,
    }))
  );
}
