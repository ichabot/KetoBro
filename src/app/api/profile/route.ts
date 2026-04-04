import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  height: z.number().positive().optional(),
  gender: z.enum(["male", "female", "diverse"]).optional(),
  birthDate: z.string().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: {
      id: true, email: true, name: true, height: true,
      gender: true, birthDate: true, activityLevel: true, createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = profileSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
    if (data.activityLevel !== undefined) updateData.activityLevel = data.activityLevel;

    const user = await prisma.user.update({
      where: { id: (session.user as { id: string }).id },
      data: updateData,
      select: {
        id: true, email: true, name: true, height: true,
        gender: true, birthDate: true, activityLevel: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}
