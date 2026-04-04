import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const vitalsSchema = z.object({
  systolic: z.number().int().positive().optional(),
  diastolic: z.number().int().positive().optional(),
  bloodGlucose: z.number().positive().optional(),
  bloodKetones: z.number().min(0).optional(),
  urineKetones: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const vitals = await prisma.vitals.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return NextResponse.json(vitals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = vitalsSchema.parse(body);

    if (!data.systolic && !data.diastolic && !data.bloodGlucose && !data.bloodKetones && !data.urineKetones) {
      return NextResponse.json({ error: "Mindestens ein Wert muss angegeben werden" }, { status: 400 });
    }

    const vitals = await prisma.vitals.create({
      data: {
        userId: (session.user as { id: string }).id,
        ...data,
      },
    });

    return NextResponse.json(vitals, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
