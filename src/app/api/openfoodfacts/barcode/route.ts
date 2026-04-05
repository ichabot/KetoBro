import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const OFF_BASE = "https://world.openfoodfacts.org";
const USER_AGENT = "KetoBro/1.0 (https://github.com/ichabot/KetoBro)";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const barcode = searchParams.get("code");

  if (!barcode) {
    return NextResponse.json({ error: "Barcode erforderlich" }, { status: 400 });
  }

  try {
    const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_de,brands,image_small_url,nutriments,serving_size,nutrition_grades&lc=de`;

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) throw new Error("OpenFoodFacts API Fehler");

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });
    }

    const p = data.product;
    const n = p.nutriments || {};

    return NextResponse.json({
      barcode: p.code,
      name: p.product_name_de || p.product_name || "Unbekanntes Produkt",
      brand: p.brands || "",
      image: p.image_small_url || null,
      nutritionGrade: p.nutrition_grades || null,
      servingSize: p.serving_size || null,
      per100g: {
        calories: n["energy-kcal_100g"] || 0,
        protein: n.proteins_100g || 0,
        fat: n.fat_100g || 0,
        carbs: n.carbohydrates_100g || 0,
        fiber: n.fiber_100g || 0,
      },
    });
  } catch (error) {
    console.error("OFF barcode error:", error);
    return NextResponse.json({ error: "Barcode-Suche fehlgeschlagen" }, { status: 500 });
  }
}
