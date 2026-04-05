import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  llmProvider: z.enum(["claude", "local"]).optional(),
  anthropicApiKey: z.string().optional(),
  llmEndpoint: z.string().url().optional().or(z.literal("")),
  llmModel: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: {
      llmProvider: true,
      anthropicApiKey: true,
      llmEndpoint: true,
      llmModel: true,
    },
  });

  // Mask API key for display
  const maskedKey = user?.anthropicApiKey
    ? user.anthropicApiKey.slice(0, 10) + "..." + user.anthropicApiKey.slice(-4)
    : "";

  return NextResponse.json({
    llmProvider: user?.llmProvider || "claude",
    anthropicApiKey: maskedKey,
    hasApiKey: !!user?.anthropicApiKey,
    llmEndpoint: user?.llmEndpoint || "",
    llmModel: user?.llmModel || "",
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = settingsSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.llmProvider !== undefined) updateData.llmProvider = data.llmProvider;
    if (data.anthropicApiKey !== undefined) {
      // Only update if not the masked version
      if (!data.anthropicApiKey.includes("...")) {
        updateData.anthropicApiKey = data.anthropicApiKey || null;
      }
    }
    if (data.llmEndpoint !== undefined) updateData.llmEndpoint = data.llmEndpoint || null;
    if (data.llmModel !== undefined) updateData.llmModel = data.llmModel || null;

    await prisma.user.update({
      where: { id: (session.user as { id: string }).id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
