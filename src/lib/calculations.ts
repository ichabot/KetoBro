// Netto-Carbs (Europa-Standard: Kohlenhydrate - Ballaststoffe)
export function calcNetCarbs(carbs: number, fiber: number): number {
  return Math.max(0, carbs - fiber);
}

// Skaldeman Ratio: Fett / (Protein + Netto-Carbs)
export function calcSkaldemanRatio(fat: number, protein: number, netCarbs: number): number | null {
  const denominator = protein + netCarbs;
  if (denominator === 0) return null;
  return Math.round((fat / denominator) * 100) / 100;
}

// BMR nach Mifflin-St Jeor
export function calcBMR(weight: number, height: number, age: number, gender: string): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

// TDEE = BMR * Aktivitätsfaktor
export function calcTDEE(bmr: number, activityLevel: string): number {
  const factors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (factors[activityLevel] || 1.2));
}

// Ketose-Status basierend auf Netto-Carbs
export function getKetosisStatus(netCarbs: number): {
  status: string;
  color: string;
  emoji: string;
} {
  if (netCarbs <= 20) return { status: "Tiefe Ketose", color: "text-green-600", emoji: "🟢" };
  if (netCarbs <= 30) return { status: "Ketose", color: "text-yellow-600", emoji: "🟡" };
  if (netCarbs <= 50) return { status: "Grenzbereich", color: "text-orange-600", emoji: "🟠" };
  return { status: "Keine Ketose", color: "text-red-600", emoji: "🔴" };
}

// Skaldeman Ratio Bewertung
export function getSkaldemanStatus(ratio: number | null): {
  status: string;
  color: string;
} {
  if (ratio === null) return { status: "Keine Daten", color: "text-gray-400" };
  if (ratio >= 1.0 && ratio <= 2.0) return { status: "Optimal", color: "text-green-600" };
  if (ratio >= 0.7 && ratio < 1.0) return { status: "Gut", color: "text-yellow-600" };
  if (ratio > 2.0) return { status: "Sehr hoch", color: "text-orange-600" };
  return { status: "Zu niedrig", color: "text-red-600" };
}

// Alter aus Geburtsdatum berechnen
export function calcAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
