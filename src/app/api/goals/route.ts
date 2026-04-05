import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const goalsSchema = z.object({
  goalWeight: z.number().min(0).optional().nullable(),
  goalCalories: z.number().int().min(0).optional().nullable(),
  goalNetCarbs: z.number().int().min(0).optional().nullable(),
  goalProtein: z.number().int().min(0).optional().nullable(),
});

function getUserId(session: { user?: { id?: string } }): string | null {
  return (session.user as { id: string })?.id ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      goalWeight: true,
      goalCalories: true,
      goalNetCarbs: true,
      goalProtein: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = goalsSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.goalWeight !== undefined) updateData.goalWeight = data.goalWeight;
    if (data.goalCalories !== undefined) updateData.goalCalories = data.goalCalories;
    if (data.goalNetCarbs !== undefined) updateData.goalNetCarbs = data.goalNetCarbs;
    if (data.goalProtein !== undefined) updateData.goalProtein = data.goalProtein;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        goalWeight: true,
        goalCalories: true,
        goalNetCarbs: true,
        goalProtein: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Goals PATCH error:", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
