"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";

  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setName(data.name || "");
          setHeight(data.height?.toString() || "");
          setGender(data.gender || "");
          setBirthDate(data.birthDate ? new Date(data.birthDate).toISOString().split("T")[0] : "");
          setActivityLevel(data.activityLevel || "");
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          height: height ? parseFloat(height) : undefined,
          gender: gender || undefined,
          birthDate: birthDate || undefined,
          activityLevel: activityLevel || undefined,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      setMessage("Profil gespeichert! ✅");
      setTimeout(() => setMessage(""), 3000);

      if (isSetup) {
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-bounce">🥑</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {isSetup && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-green-800">🎉 Willkommen bei KetoBro!</h2>
          <p className="text-green-700 text-sm mt-1">
            Bitte fülle dein Profil aus, damit KetoBro dir optimal helfen kann.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>👤 Profil</CardTitle>
          <CardDescription>
            Deine persönlichen Daten für präzise Berechnungen (BMR, TDEE, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`p-3 rounded-md mb-4 text-sm ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Dein Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={session?.user?.email || ""} disabled className="bg-gray-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Körpergröße (cm)</Label>
                <Input id="height" type="number" placeholder="z.B. 178" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Geschlecht</Label>
                <Select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Bitte wählen</option>
                  <option value="male">Männlich</option>
                  <option value="female">Weiblich</option>
                  <option value="diverse">Divers</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Geburtsdatum</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityLevel">Aktivitätslevel</Label>
                <Select id="activityLevel" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                  <option value="">Bitte wählen</option>
                  <option value="sedentary">Sitzend (wenig Bewegung)</option>
                  <option value="light">Leicht aktiv (1-3x/Woche)</option>
                  <option value="moderate">Moderat aktiv (3-5x/Woche)</option>
                  <option value="active">Aktiv (6-7x/Woche)</option>
                  <option value="very_active">Sehr aktiv (2x/Tag)</option>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Speichern..." : isSetup ? "Profil speichern & zum Dashboard" : "Profil aktualisieren"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
