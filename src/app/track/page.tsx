"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { BarcodeScanner } from "@/components/barcode-scanner";

type Tab = "measurements" | "vitals" | "nutrition";

interface OFFProduct {
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  nutritionGrade: string | null;
  servingSize: string | null;
  per100g: { calories: number; protein: number; fat: number; carbs: number; fiber: number };
}

interface Favorite {
  barcode: string;
  name: string;
  brand: string | null;
  image: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
}

export default function TrackPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("measurements");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Measurements
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [thigh, setThigh] = useState("");
  const [arm, setArm] = useState("");

  // Vitals
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bloodGlucose, setBloodGlucose] = useState("");
  const [bloodKetones, setBloodKetones] = useState("");
  const [urineKetones, setUrineKetones] = useState("");

  // Nutrition
  const [mealType, setMealType] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 10) return "breakfast";
    if (hour < 14) return "lunch";
    if (hour < 17) return "snack";
    return "dinner";
  });
  const [productName, setProductName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fiber, setFiber] = useState("");

  // OpenFoodFacts
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OFFProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [portionGrams, setPortionGrams] = useState("100");
  const [selectedProduct, setSelectedProduct] = useState<OFFProduct | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Read tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "nutrition" || tab === "vitals" || tab === "measurements") {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "nutrition") {
      fetch("/api/favorites").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setFavorites(data);
      });
    }
  }, [activeTab]);

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchProducts = async () => {
    // Read directly from the input element to avoid stale state
    const query = searchInputRef.current?.value || searchQuery;
    if (!query.trim() || query.trim().length < 2) {
      showMessage("Bitte mindestens 2 Zeichen eingeben", true);
      return;
    }
    setSearching(true);
    setSearchResults([]);
    setShowFavorites(false);
    try {
      const res = await fetch("/api/openfoodfacts/search?q=" + encodeURIComponent(query.trim()));
      if (!res.ok) throw new Error("API Error " + res.status);
      const data = await res.json();
      setSearchResults(data.products || []);
      if (data.products?.length === 0) showMessage("Keine Produkte gefunden für: " + query, true);
    } catch (err) {
      console.error("Search error:", err);
      showMessage("Suche fehlgeschlagen — bitte erneut versuchen", true);
    }
    setSearching(false);
  };

  const lookupBarcode = async () => {
    if (!barcodeQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/openfoodfacts/barcode?code=${encodeURIComponent(barcodeQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults([data]);
        selectProduct(data, 100);
      } else { showMessage(data.error || "Nicht gefunden", true); }
    } catch { showMessage("Barcode-Suche fehlgeschlagen", true); }
    setSearching(false);
  };

  const selectProduct = (product: OFFProduct, grams: number = 100) => {
    setSelectedProduct(product);
    setProductName(product.name + (product.brand ? ` (${product.brand})` : ""));
    const factor = grams / 100;
    setCalories(Math.round(product.per100g.calories * factor).toString());
    setProtein((Math.round(product.per100g.protein * factor * 10) / 10).toString());
    setFat((Math.round(product.per100g.fat * factor * 10) / 10).toString());
    setCarbs((Math.round(product.per100g.carbs * factor * 10) / 10).toString());
    setFiber((Math.round(product.per100g.fiber * factor * 10) / 10).toString());
  };

  const selectFavorite = (fav: Favorite) => {
    const product: OFFProduct = {
      barcode: fav.barcode, name: fav.name, brand: fav.brand || "",
      image: fav.image, nutritionGrade: null, servingSize: null,
      per100g: { calories: fav.caloriesPer100g, protein: fav.proteinPer100g, fat: fav.fatPer100g, carbs: fav.carbsPer100g, fiber: fav.fiberPer100g },
    };
    selectProduct(product, parseFloat(portionGrams) || 100);
    setShowFavorites(false);
  };

  const toggleFavorite = async (product: OFFProduct) => {
    const isFav = favorites.some(f => f.barcode === product.barcode);
    if (isFav) {
      await fetch("/api/favorites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barcode: product.barcode }) });
      setFavorites(prev => prev.filter(f => f.barcode !== product.barcode));
    } else {
      await fetch("/api/favorites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: product.barcode, name: product.name, brand: product.brand, image: product.image,
          caloriesPer100g: product.per100g.calories, proteinPer100g: product.per100g.protein,
          fatPer100g: product.per100g.fat, carbsPer100g: product.per100g.carbs, fiberPer100g: product.per100g.fiber,
        }),
      });
      setFavorites(prev => [...prev, {
        barcode: product.barcode, name: product.name, brand: product.brand, image: product.image,
        caloriesPer100g: product.per100g.calories, proteinPer100g: product.per100g.protein,
        fatPer100g: product.per100g.fat, carbsPer100g: product.per100g.carbs, fiberPer100g: product.per100g.fiber,
      }]);
    }
  };

  const updatePortion = (grams: string) => {
    setPortionGrams(grams);
    if (selectedProduct && grams) selectProduct(selectedProduct, parseFloat(grams) || 100);
  };

  const saveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/measurements", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: parseFloat(weight), waist: waist ? parseFloat(waist) : undefined, thigh: thigh ? parseFloat(thigh) : undefined, arm: arm ? parseFloat(arm) : undefined }) });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Messung gespeichert! ✅");
      setWeight(""); setWaist(""); setThigh(""); setArm("");
    } catch (err) { showMessage(err instanceof Error ? err.message : "Fehler", true); }
    setSaving(false);
  };

  const saveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vitals", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systolic: systolic ? parseInt(systolic) : undefined, diastolic: diastolic ? parseInt(diastolic) : undefined,
          bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : undefined, bloodKetones: bloodKetones ? parseFloat(bloodKetones) : undefined,
          urineKetones: urineKetones ? parseFloat(urineKetones) : undefined }) });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Vitalwerte gespeichert! ✅");
      setSystolic(""); setDiastolic(""); setBloodGlucose(""); setBloodKetones(""); setUrineKetones("");
    } catch (err) { showMessage(err instanceof Error ? err.message : "Fehler", true); }
    setSaving(false);
  };

  const saveNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/nutrition", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType, productName: productName || undefined,
          barcode: selectedProduct?.barcode, portionGrams: portionGrams ? parseFloat(portionGrams) : undefined,
          imageUrl: selectedProduct?.image || undefined,
          calories: parseFloat(calories), protein: parseFloat(protein), fat: parseFloat(fat), carbs: parseFloat(carbs), fiber: parseFloat(fiber),
        }) });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Mahlzeit gespeichert! ✅");
      setCalories(""); setProtein(""); setFat(""); setCarbs(""); setFiber("");
      setSelectedProduct(null); setSearchResults([]); setSearchQuery(""); setBarcodeQuery(""); setProductName("");
    } catch (err) { showMessage(err instanceof Error ? err.message : "Fehler", true); }
    setSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "measurements", label: "Körpermaße", icon: "⚖️" },
    { id: "vitals", label: "Vitalwerte", icon: "❤️" },
    { id: "nutrition", label: "Ernährung", icon: "🍎" },
  ];

  const gradeColors: Record<string, string> = { a: "bg-green-500", b: "bg-lime-500", c: "bg-yellow-500", d: "bg-orange-500", e: "bg-red-500" };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">📝 Daten erfassen</h1>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm" : "text-gray-600 dark:text-gray-400"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-md mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

      {/* Measurements */}
      {activeTab === "measurements" && (
        <Card>
          <CardHeader><CardTitle>⚖️ Körpermaße</CardTitle><CardDescription>Gewicht ist Pflicht, Umfänge optional</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={saveMeasurement} className="space-y-4">
              <div className="space-y-2"><Label>Gewicht (kg) *</Label><Input type="number" step="0.1" placeholder="85.5" value={weight} onChange={(e) => setWeight(e.target.value)} required /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Bauch (cm)</Label><Input type="number" step="0.5" value={waist} onChange={(e) => setWaist(e.target.value)} /></div>
                <div className="space-y-2"><Label>Bein (cm)</Label><Input type="number" step="0.5" value={thigh} onChange={(e) => setThigh(e.target.value)} /></div>
                <div className="space-y-2"><Label>Arm (cm)</Label><Input type="number" step="0.5" value={arm} onChange={(e) => setArm(e.target.value)} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Speichern..." : "Messung speichern"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vitals */}
      {activeTab === "vitals" && (
        <Card>
          <CardHeader><CardTitle>❤️ Vitalwerte</CardTitle><CardDescription>Alle Felder optional</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={saveVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Systolisch</Label><Input type="number" placeholder="120" value={systolic} onChange={(e) => setSystolic(e.target.value)} /></div>
                <div className="space-y-2"><Label>Diastolisch</Label><Input type="number" placeholder="80" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Blutzucker (mg/dl)</Label><Input type="number" step="0.1" value={bloodGlucose} onChange={(e) => setBloodGlucose(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Blutketone (mmol/L)</Label><Input type="number" step="0.1" value={bloodKetones} onChange={(e) => setBloodKetones(e.target.value)} /></div>
                <div className="space-y-2"><Label>Urinketone (mg/dl)</Label><Input type="number" step="0.1" value={urineKetones} onChange={(e) => setUrineKetones(e.target.value)} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Speichern..." : "Vitalwerte speichern"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            setShowScanner(false);
            setBarcodeQuery(code);
            // Delay lookup slightly to let scanner cleanup
            setTimeout(() => {
              setSearching(true);
              setSearchResults([]);
              fetch("/api/openfoodfacts/barcode?code=" + encodeURIComponent(code))
                .then(r => r.json())
                .then(data => {
                  if (data.barcode) {
                    setSearchResults([data]);
                    selectProduct(data, parseFloat(portionGrams) || 100);
                  } else {
                    showMessage(data.error || "Nicht gefunden", true);
                  }
                })
                .catch(() => showMessage("Barcode-Suche fehlgeschlagen", true))
                .finally(() => setSearching(false));
            }, 300);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Nutrition */}
      {activeTab === "nutrition" && (
        <div className="space-y-6">
          {/* Product Search */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div><CardTitle>🔍 Produkt suchen</CardTitle><CardDescription>OpenFoodFacts oder Favoriten</CardDescription></div>
                {favorites.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => { setShowFavorites(!showFavorites); setSearchResults([]); }}>
                    ⭐ Favoriten ({favorites.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input ref={searchInputRef} placeholder="Produktname..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchProducts()} />
                <Button onClick={searchProducts} disabled={searching} variant="outline" className="min-w-[44px]">
                  {searching ? <span className="inline-block w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : "🔍"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Barcode (z.B. 4006040003625)" value={barcodeQuery} onChange={(e) => setBarcodeQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookupBarcode()} />
                <Button onClick={lookupBarcode} disabled={searching} variant="outline">{searching ? "..." : "📊"}</Button>
                <Button onClick={() => setShowScanner(true)} variant="outline" title="Kamera-Scanner">📷</Button>
              </div>

              {/* Favorites */}
              {showFavorites && favorites.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">⭐ Deine Favoriten</div>
                  {favorites.map((fav) => (
                    <button key={fav.barcode} onClick={() => selectFavorite(fav)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        {fav.image && <img src={fav.image} alt="" className="w-10 h-10 object-contain rounded" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{fav.name}</div>
                          <div className="text-xs text-gray-500">{fav.brand}</div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          <div>{Math.round(fav.caloriesPer100g)} kcal/100g</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden">
                  {searchResults.map((product) => (
                    <div key={product.barcode} className={`p-3 rounded-lg border transition-colors ${selectedProduct?.barcode === product.barcode ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                      <button onClick={() => selectProduct(product, parseFloat(portionGrams) || 100)} className="w-full text-left">
                        <div className="flex items-center gap-3">
                          {product.image && <img src={product.image} alt="" className="w-10 h-10 object-contain rounded" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.brand}</div>
                          </div>
                          <div className="text-xs text-gray-500 text-right"><div>{Math.round(product.per100g.calories)} kcal</div></div>
                          {product.nutritionGrade && (
                            <div className={`w-6 h-6 rounded-full ${gradeColors[product.nutritionGrade] || "bg-gray-400"} text-white text-xs flex items-center justify-center font-bold uppercase`}>{product.nutritionGrade}</div>
                          )}
                        </div>
                      </button>
                      <button onClick={() => toggleFavorite(product)} className="text-xs mt-1 text-gray-400 hover:text-yellow-500">
                        {favorites.some(f => f.barcode === product.barcode) ? "⭐ Favorit entfernen" : "☆ Als Favorit speichern"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap">Portion:</Label>
                    <Input type="number" value={portionGrams} onChange={(e) => updatePortion(e.target.value)} className="w-24" step="10" min="1" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">g</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">✅ {selectedProduct.name} — {portionGrams}g</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meal Entry Form */}
          <Card>
            <CardHeader><CardTitle>🥑 Mahlzeit eintragen</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={saveNutrition} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mahlzeit *</Label>
                    <Select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                      <option value="breakfast">🌅 Frühstück</option>
                      <option value="lunch">☀️ Mittagessen</option>
                      <option value="dinner">🌙 Abendessen</option>
                      <option value="snack">🍿 Snack</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Produktname</Label>
                    <Input placeholder="z.B. Avocado" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2"><Label>Kalorien (kcal) *</Label><Input type="number" placeholder="1800" value={calories} onChange={(e) => setCalories(e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Protein (g) *</Label><Input type="number" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Fett (g) *</Label><Input type="number" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Kohlenhydrate (g) *</Label><Input type="number" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Ballaststoffe (g) *</Label><Input type="number" step="0.1" value={fiber} onChange={(e) => setFiber(e.target.value)} required /></div>
                </div>
                {carbs && fiber && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-sm">
                    <strong>Netto-Carbs:</strong> {Math.max(0, parseFloat(carbs) - parseFloat(fiber)).toFixed(1)}g
                    {parseFloat(carbs) - parseFloat(fiber) <= 20 && " 🟢 Tiefe Ketose"}
                    {parseFloat(carbs) - parseFloat(fiber) > 20 && parseFloat(carbs) - parseFloat(fiber) <= 30 && " 🟡 Ketose"}
                    {parseFloat(carbs) - parseFloat(fiber) > 30 && parseFloat(carbs) - parseFloat(fiber) <= 50 && " 🟠 Grenzbereich"}
                    {parseFloat(carbs) - parseFloat(fiber) > 50 && " 🔴 Keine Ketose"}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={saving}>{saving ? "Speichern..." : "Mahlzeit speichern"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
