import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { onboardingDone: true },
  });

  return NextResponse.json({ onboardingDone: user?.onboardingDone ?? false });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as { id: string }).id;

  // Save all onboarding data at once
  const updateData: Record<string, unknown> = {};

  if (body.name) updateData.name = body.name;
  if (body.height) updateData.height = parseFloat(body.height);
  if (body.gender) updateData.gender = body.gender;
  if (body.birthDate) updateData.birthDate = new Date(body.birthDate);
  if (body.activityLevel) updateData.activityLevel = body.activityLevel;
  if (body.goalWeight) updateData.goalWeight = parseFloat(body.goalWeight);
  if (body.goalCalories) updateData.goalCalories = parseInt(body.goalCalories);
  if (body.goalNetCarbs) updateData.goalNetCarbs = parseInt(body.goalNetCarbs);

  updateData.onboardingDone = true;

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Create initial measurement if weight provided
  if (body.weight) {
    await prisma.measurement.create({
      data: {
        userId,
        weight: parseFloat(body.weight),
      },
    });
  }

  return NextResponse.json({ success: true });
}
