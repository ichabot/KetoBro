"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [llmProvider, setLlmProvider] = useState("claude");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [llmEndpoint, setLlmEndpoint] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          setLlmProvider(data.llmProvider || "claude");
          setAnthropicApiKey(data.anthropicApiKey || "");
          setLlmEndpoint(data.llmEndpoint || "");
          setLlmModel(data.llmModel || "");
          setHasApiKey(data.hasApiKey);
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          llmProvider,
          anthropicApiKey: anthropicApiKey.includes("...") ? undefined : anthropicApiKey,
          llmEndpoint,
          llmModel,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      setMessage("Einstellungen gespeichert! ✅");
      if (anthropicApiKey && !anthropicApiKey.includes("...")) {
        setHasApiKey(true);
      }
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler");
    }
    setSaving(false);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Antworte nur mit: KetoBro funktioniert! 🥑" }),
      });

      if (!res.ok) {
        const data = await res.json();
        setTestResult("❌ " + (data.error || "Verbindung fehlgeschlagen"));
      } else {
        setTestResult("✅ KI-Verbindung funktioniert!");
      }
    } catch {
      setTestResult("❌ Verbindungsfehler");
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-bounce">⚙️</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">⚙️ Einstellungen</h1>

      {message && (
        <div className={`p-3 rounded-md mb-4 text-sm ${message.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {message}
        </div>
      )}

      {/* KI-Anbieter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🤖 KI-Anbieter</CardTitle>
          <CardDescription>
            Wähle den KI-Anbieter für den KetoBro Chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => setLlmProvider("claude")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                llmProvider === "claude"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold">☁️ Claude (Anthropic)</div>
              <div className="text-sm text-gray-500 mt-1">
                Cloud API - benötigt API Key
              </div>
            </button>
            <button
              onClick={() => setLlmProvider("local")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                llmProvider === "local"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold">🖥️ Lokales LLM</div>
              <div className="text-sm text-gray-500 mt-1">
                LM Studio, Ollama, etc.
              </div>
            </button>
          </div>

          {llmProvider === "claude" && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  Anthropic API Key
                  {hasApiKey && <Badge className="ml-2" variant="default">Gespeichert</Badge>}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-ant-api03-..."
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Erstelle einen Key auf{" "}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-green-600 hover:underline">
                    console.anthropic.com
                  </a>
                </p>
              </div>
            </div>
          )}

          {llmProvider === "local" && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  placeholder="http://localhost:1234/v1"
                  value={llmEndpoint}
                  onChange={(e) => setLlmEndpoint(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  OpenAI-kompatible API (LM Studio, Ollama mit OpenAI-Bridge, vLLM, etc.)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modellname</Label>
                <Input
                  id="model"
                  placeholder="z.B. mistral-7b, llama-3.1-8b"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Speichern..." : "Einstellungen speichern"}
            </Button>
            <Button onClick={testConnection} disabled={testing} variant="outline">
              {testing ? "Teste..." : "🔌 Verbindung testen"}
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-md text-sm ${testResult.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {testResult}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenFoodFacts */}
      <Card>
        <CardHeader>
          <CardTitle>🍎 OpenFoodFacts</CardTitle>
          <CardDescription>
            Lebensmittel-Datenbank für einfaches Ernährungs-Tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">Kostenlos</Badge>
              <Badge variant="secondary">Kein API Key nötig</Badge>
            </div>
            <p className="text-sm text-gray-700">
              OpenFoodFacts ist eine freie, offene Lebensmittel-Datenbank mit über 3 Millionen Produkten.
              Du kannst Produkte per Name oder Barcode suchen und die Nährwerte direkt in dein Tracking übernehmen.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Nutze die Produktsuche im Tab &quot;🍎 Ernährung&quot; unter &quot;Daten erfassen&quot;.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
