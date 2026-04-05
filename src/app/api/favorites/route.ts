import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addFavoriteSchema = z.object({
  barcode: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().optional(),
  image: z.string().optional(),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fiberPer100g: z.number().min(0),
});

const deleteFavoriteSchema = z.object({
  barcode: z.string().min(1),
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

  const favorites = await prisma.favoriteProduct.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = addFavoriteSchema.parse(body);

    // Upsert to handle duplicates gracefully
    const favorite = await prisma.favoriteProduct.upsert({
      where: {
        userId_barcode: {
          userId,
          barcode: data.barcode,
        },
      },
      update: {
        name: data.name,
        brand: data.brand,
        image: data.image,
        caloriesPer100g: data.caloriesPer100g,
        proteinPer100g: data.proteinPer100g,
        fatPer100g: data.fatPer100g,
        carbsPer100g: data.carbsPer100g,
        fiberPer100g: data.fiberPer100g,
      },
      create: {
        userId,
        barcode: data.barcode,
        name: data.name,
        brand: data.brand,
        image: data.image,
        caloriesPer100g: data.caloriesPer100g,
        proteinPer100g: data.proteinPer100g,
        fatPer100g: data.fatPer100g,
        carbsPer100g: data.carbsPer100g,
        fiberPer100g: data.fiberPer100g,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Favorites POST error:", error);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  try {
    const body = await req.json();
    const data = deleteFavoriteSchema.parse(body);

    await prisma.favoriteProduct.delete({
      where: {
        userId_barcode: {
          userId,
          barcode: data.barcode,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Favorites DELETE error:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
