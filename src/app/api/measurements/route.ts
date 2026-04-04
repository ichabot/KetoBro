import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const measurementSchema = z.object({
  weight: z.number().positive(),
  waist: z.number().positive().optional(),
  thigh: z.number().positive().optional(),
  arm: z.number().positive().optional(),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const measurements = await prisma.measurement.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(measurements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = measurementSchema.parse(body);

    const measurement = await prisma.measurement.create({
      data: {
        userId: (session.user as { id: string }).id,
        weight: data.weight,
        waist: data.waist,
        thigh: data.thigh,
        arm: data.arm,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
