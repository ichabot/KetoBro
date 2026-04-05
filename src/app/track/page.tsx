"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "measurements" | "vitals" | "nutrition";

interface OFFProduct {
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  nutritionGrade: string | null;
  servingSize: string | null;
  per100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
}

export default function TrackPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("measurements");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Measurements form
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [thigh, setThigh] = useState("");
  const [arm, setArm] = useState("");

  // Vitals form
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bloodGlucose, setBloodGlucose] = useState("");
  const [bloodKetones, setBloodKetones] = useState("");
  const [urineKetones, setUrineKetones] = useState("");

  // Nutrition form
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

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setSuccess(""); setError(""); }, 3000);
  };

  // === OpenFoodFacts Functions ===
  const searchProducts = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/openfoodfacts/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.products || []);
        if (data.products?.length === 0) showMessage("Keine Produkte gefunden", true);
      } else {
        showMessage(data.error || "Suche fehlgeschlagen", true);
      }
    } catch {
      showMessage("Suche fehlgeschlagen", true);
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
      } else {
        showMessage(data.error || "Produkt nicht gefunden", true);
      }
    } catch {
      showMessage("Barcode-Suche fehlgeschlagen", true);
    }
    setSearching(false);
  };

  const selectProduct = (product: OFFProduct, grams: number = 100) => {
    setSelectedProduct(product);
    const factor = grams / 100;
    setCalories(Math.round(product.per100g.calories * factor).toString());
    setProtein((Math.round(product.per100g.protein * factor * 10) / 10).toString());
    setFat((Math.round(product.per100g.fat * factor * 10) / 10).toString());
    setCarbs((Math.round(product.per100g.carbs * factor * 10) / 10).toString());
    setFiber((Math.round(product.per100g.fiber * factor * 10) / 10).toString());
  };

  const updatePortion = (grams: string) => {
    setPortionGrams(grams);
    if (selectedProduct && grams) {
      selectProduct(selectedProduct, parseFloat(grams) || 100);
    }
  };

  // === Save Functions ===
  const saveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: parseFloat(weight),
          waist: waist ? parseFloat(waist) : undefined,
          thigh: thigh ? parseFloat(thigh) : undefined,
          arm: arm ? parseFloat(arm) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Messung gespeichert! ✅");
      setWeight(""); setWaist(""); setThigh(""); setArm("");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Fehler", true);
    }
    setSaving(false);
  };

  const saveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systolic: systolic ? parseInt(systolic) : undefined,
          diastolic: diastolic ? parseInt(diastolic) : undefined,
          bloodGlucose: bloodGlucose ? parseFloat(bloodGlucose) : undefined,
          bloodKetones: bloodKetones ? parseFloat(bloodKetones) : undefined,
          urineKetones: urineKetones ? parseFloat(urineKetones) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Vitalwerte gespeichert! ✅");
      setSystolic(""); setDiastolic(""); setBloodGlucose(""); setBloodKetones(""); setUrineKetones("");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Fehler", true);
    }
    setSaving(false);
  };

  const saveNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calories: parseFloat(calories),
          protein: parseFloat(protein),
          fat: parseFloat(fat),
          carbs: parseFloat(carbs),
          fiber: parseFloat(fiber),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showMessage("Ernährungsdaten gespeichert! ✅");
      setCalories(""); setProtein(""); setFat(""); setCarbs(""); setFiber("");
      setSelectedProduct(null); setSearchResults([]); setSearchQuery(""); setBarcodeQuery("");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Fehler", true);
    }
    setSaving(false);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "measurements", label: "Körpermaße", icon: "⚖️" },
    { id: "vitals", label: "Vitalwerte", icon: "❤️" },
    { id: "nutrition", label: "Ernährung", icon: "🍎" },
  ];

  const gradeColors: Record<string, string> = {
    a: "bg-green-500", b: "bg-lime-500", c: "bg-yellow-500", d: "bg-orange-500", e: "bg-red-500",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">📝 Daten erfassen</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

      {/* Measurements Form */}
      {activeTab === "measurements" && (
        <Card>
          <CardHeader>
            <CardTitle>⚖️ Körpermaße</CardTitle>
            <CardDescription>Gewicht ist Pflicht, Umfänge sind optional</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveMeasurement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Gewicht (kg) *</Label>
                <Input id="weight" type="number" step="0.1" placeholder="z.B. 85.5" value={weight} onChange={(e) => setWeight(e.target.value)} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waist">Bauch (cm)</Label>
                  <Input id="waist" type="number" step="0.5" placeholder="95" value={waist} onChange={(e) => setWaist(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thigh">Bein (cm)</Label>
                  <Input id="thigh" type="number" step="0.5" placeholder="58" value={thigh} onChange={(e) => setThigh(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arm">Arm (cm)</Label>
                  <Input id="arm" type="number" step="0.5" placeholder="35" value={arm} onChange={(e) => setArm(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Speichern..." : "Messung speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vitals Form */}
      {activeTab === "vitals" && (
        <Card>
          <CardHeader>
            <CardTitle>❤️ Vitalwerte</CardTitle>
            <CardDescription>Alle Felder sind optional</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Systolisch (mmHg)</Label>
                  <Input type="number" placeholder="120" value={systolic} onChange={(e) => setSystolic(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Diastolisch (mmHg)</Label>
                  <Input type="number" placeholder="80" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Blutzucker (mg/dl)</Label>
                <Input type="number" step="0.1" placeholder="85" value={bloodGlucose} onChange={(e) => setBloodGlucose(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blutketone (mmol/L)</Label>
                  <Input type="number" step="0.1" placeholder="1.5" value={bloodKetones} onChange={(e) => setBloodKetones(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Urinketone (mg/dl)</Label>
                  <Input type="number" step="0.1" placeholder="40" value={urineKetones} onChange={(e) => setUrineKetones(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Speichern..." : "Vitalwerte speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Nutrition Form with OpenFoodFacts */}
      {activeTab === "nutrition" && (
        <div className="space-y-6">
          {/* OpenFoodFacts Search */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Produkt suchen (OpenFoodFacts)</CardTitle>
              <CardDescription>Suche nach Produktnamen oder scanne einen Barcode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Produktname suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchProducts()}
                />
                <Button onClick={searchProducts} disabled={searching} variant="outline">
                  {searching ? "..." : "🔍"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Barcode eingeben (z.B. 4006040003625)"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && lookupBarcode()}
                />
                <Button onClick={lookupBarcode} disabled={searching} variant="outline">
                  {searching ? "..." : "📊"}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.barcode}
                      onClick={() => { selectProduct(product, parseFloat(portionGrams) || 100); }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedProduct?.barcode === product.barcode
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img src={product.image} alt="" className="w-10 h-10 object-contain rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.brand}</div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>{Math.round(product.per100g.calories)} kcal</div>
                          <div>pro 100g</div>
                        </div>
                        {product.nutritionGrade && (
                          <div className={`w-6 h-6 rounded-full ${gradeColors[product.nutritionGrade] || "bg-gray-400"} text-white text-xs flex items-center justify-center font-bold uppercase`}>
                            {product.nutritionGrade}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Portion size */}
              {selectedProduct && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap">Portionsgröße:</Label>
                    <Input
                      type="number"
                      value={portionGrams}
                      onChange={(e) => updatePortion(e.target.value)}
                      className="w-24"
                      step="10"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">Gramm</span>
                    {selectedProduct.servingSize && (
                      <span className="text-xs text-gray-400">
                        (Packung: {selectedProduct.servingSize})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ✅ {selectedProduct.name} — Werte für {portionGrams}g übernommen
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Manual Entry / Filled from OFF */}
          <Card>
            <CardHeader>
              <CardTitle>🥑 Ernährungsdaten</CardTitle>
              <CardDescription>
                {selectedProduct ? "Werte aus Produktsuche übernommen — passe sie bei Bedarf an" : "Manuelle Eingabe oder nutze die Produktsuche oben"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveNutrition} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kalorien (kcal) *</Label>
                  <Input type="number" placeholder="z.B. 1800" value={calories} onChange={(e) => setCalories(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Protein (g) *</Label>
                    <Input type="number" step="0.1" placeholder="120" value={protein} onChange={(e) => setProtein(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Fett (g) *</Label>
                    <Input type="number" step="0.1" placeholder="140" value={fat} onChange={(e) => setFat(e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kohlenhydrate gesamt (g) *</Label>
                    <Input type="number" step="0.1" placeholder="30" value={carbs} onChange={(e) => setCarbs(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Ballaststoffe (g) *</Label>
                    <Input type="number" step="0.1" placeholder="15" value={fiber} onChange={(e) => setFiber(e.target.value)} required />
                  </div>
                </div>
                {carbs && fiber && (
                  <div className="bg-green-50 p-3 rounded-md text-sm">
                    <strong>Netto-Carbs:</strong> {Math.max(0, parseFloat(carbs) - parseFloat(fiber)).toFixed(1)}g
                    {parseFloat(carbs) - parseFloat(fiber) <= 20 && " 🟢 Tiefe Ketose"}
                    {parseFloat(carbs) - parseFloat(fiber) > 20 && parseFloat(carbs) - parseFloat(fiber) <= 30 && " 🟡 Ketose"}
                    {parseFloat(carbs) - parseFloat(fiber) > 30 && parseFloat(carbs) - parseFloat(fiber) <= 50 && " 🟠 Grenzbereich"}
                    {parseFloat(carbs) - parseFloat(fiber) > 50 && " 🔴 Keine Ketose"}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Speichern..." : "Ernährungsdaten speichern"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
