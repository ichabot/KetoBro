import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const day = await prisma.nutritionDay.findUnique({ where: { id } });
    if (!day || day.userId !== userId) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }

    // Cascade will delete all meal entries
    await prisma.nutritionDay.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
