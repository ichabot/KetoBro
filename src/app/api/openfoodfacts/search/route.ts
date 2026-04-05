import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const USER_AGENT = "KetoBro/1.0 (https://github.com/ichabot/KetoBro)";

// Use the newer Search-a-licious engine — much more reliable than cgi/search.pl
const SEARCH_URL = "https://search.openfoodfacts.org/search";

interface SearchHit {
  code: string;
  product_name?: string;
  product_name_de?: string;
  brands?: string[] | string;
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

function mapProduct(p: SearchHit) {
  const n = p.nutriments || {};
  const brands = Array.isArray(p.brands) ? p.brands.join(", ") : (p.brands || "");
  return {
    barcode: p.code,
    name: p.product_name_de || p.product_name || "Unbekanntes Produkt",
    brand: brands,
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
  const page = parseInt(searchParams.get("page") || "1");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Suchbegriff zu kurz" }, { status: 400 });
  }

  try {
    const fields = "code,product_name,product_name_de,brands,image_small_url,nutriments,serving_size,nutrition_grades";
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&page=${page}&page_size=10&fields=${fields}&langs=de`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("Search API error: " + response.status);
    }

    const data = await response.json();
    const hits: SearchHit[] = data.hits || [];

    const products = hits
      .filter((p) => (p.product_name || p.product_name_de) && p.nutriments)
      .map(mapProduct)
      // Filter out products with no nutritional data at all
      .filter((p) => p.per100g.calories > 0 || p.per100g.protein > 0 || p.per100g.fat > 0);

    return NextResponse.json({
      products,
      total: data.count || 0,
      page,
    });
  } catch (error) {
    console.error("OFF search error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Suche hat zu lange gedauert." }, { status: 504 });
    }
    return NextResponse.json({ error: "Suche fehlgeschlagen." }, { status: 500 });
  }
}
