import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithKetoBro } from "@/lib/claude";
import { calcBMR, calcTDEE, calcAge, getKetosisStatus } from "@/lib/calculations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    where: { userId: (session.user as { id: string }).id },
    orderBy: { timestamp: "asc" },
    take: 50,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Nachricht erforderlich" }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;

    // Rate limiting
    const rateCheck = await checkRateLimit(userId, prisma);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: `Rate Limit erreicht. Bitte warte ${rateCheck.remainingMinutes} Minuten.`
      }, { status: 429 });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { userId, role: "user", content: message },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const latestMeasurement = await prisma.measurement.findFirst({
      where: { userId }, orderBy: { date: "desc" },
    });
    const firstMeasurement = await prisma.measurement.findFirst({
      where: { userId }, orderBy: { date: "asc" },
    });
    const latestNutrition = await prisma.nutritionDay.findFirst({
      where: { userId }, orderBy: { date: "desc" },
    });

    let bmr: number | null = null;
    let tdee: number | null = null;
    let age: number | null = null;

    if (user?.birthDate) age = calcAge(new Date(user.birthDate));
    if (user?.height && latestMeasurement?.weight && age && user?.gender) {
      bmr = calcBMR(latestMeasurement.weight, user.height, age, user.gender);
      if (user.activityLevel) tdee = calcTDEE(bmr, user.activityLevel);
    }

    const weightChange = latestMeasurement && firstMeasurement
      ? Math.round((latestMeasurement.weight - firstMeasurement.weight) * 10) / 10
      : null;

    const ketosisStatus = latestNutrition
      ? getKetosisStatus(latestNutrition.totalNetCarbs).status
      : null;

    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId }, orderBy: { timestamp: "desc" }, take: 10,
    });

    const chatMessages = recentMessages
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const llmConfig = {
      provider: (user?.llmProvider || "claude") as "claude" | "local",
      apiKey: user?.anthropicApiKey,
      endpoint: user?.llmEndpoint,
      model: user?.llmModel,
    };

    const response = await chatWithKetoBro(chatMessages, {
      name: user?.name,
      height: user?.height,
      gender: user?.gender,
      age,
      activityLevel: user?.activityLevel,
      latestWeight: latestMeasurement?.weight,
      weightChange,
      latestNetCarbs: latestNutrition?.totalNetCarbs,
      latestSkaldemanRatio: latestNutrition?.skaldemanRatio,
      ketosisStatus,
      bmr,
      tdee,
    }, llmConfig);

    const assistantMessage = await prisma.chatMessage.create({
      data: { userId, role: "assistant", content: response },
    });

    return NextResponse.json(assistantMessage, { status: 201 });
  } catch (error) {
    console.error("Chat error:", error);
    const errMsg = error instanceof Error ? error.message : "Chat-Fehler aufgetreten";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
