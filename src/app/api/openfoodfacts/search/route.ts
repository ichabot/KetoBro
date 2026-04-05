import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const USER_AGENT = "KetoBro/1.0 (https://github.com/ichabot/KetoBro)";

interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_de?: string;
  brands?: string;
  image_small_url?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    fiber_100g?: number;
    [key: string]: unknown;
  };
  serving_size?: string;
  nutrition_grades?: string;
}

function mapProduct(p: OFFProduct) {
  const n = p.nutriments || {};
  return {
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
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const page = searchParams.get("page") || "1";

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Suchbegriff zu kurz" }, { status: 400 });
  }

  try {
    // Use the v2 search API with specific fields for faster response
    const fields = "code,product_name,product_name_de,brands,image_small_url,nutriments,serving_size,nutrition_grades";
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=10&fields=${fields}&lc=de`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error("OpenFoodFacts API Fehler: " + response.status);

    const data = await response.json();
    const products = (data.products || [])
      .filter((p: OFFProduct) => (p.product_name || p.product_name_de) && p.nutriments)
      .map(mapProduct);

    return NextResponse.json({
      products,
      total: data.count || 0,
      page: parseInt(page),
    });
  } catch (error) {
    console.error("OFF search error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Suche hat zu lange gedauert. Bitte erneut versuchen." }, { status: 504 });
    }
    return NextResponse.json({ error: "Suche fehlgeschlagen. Bitte erneut versuchen." }, { status: 500 });
  }
}
