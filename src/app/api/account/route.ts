import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const userId = (session.user as { id: string }).id;
    const { confirmEmail } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    if (confirmEmail !== user.email) {
      return NextResponse.json({ error: "Email-Bestätigung stimmt nicht überein" }, { status: 400 });
    }

    // Cascade delete handles all related data
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "Account und alle Daten wurden gelöscht" });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen des Accounts" }, { status: 500 });
  }
}
