"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/providers";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useTheme();

  // LLM Settings
  const [llmProvider, setLlmProvider] = useState("claude");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [llmEndpoint, setLlmEndpoint] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Account deletion
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

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
      if (anthropicApiKey && !anthropicApiKey.includes("...")) setHasApiKey(true);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler");
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setPwMessage("❌ Passwörter stimmen nicht überein");
      return;
    }
    if (newPassword.length < 8) {
      setPwMessage("❌ Neues Passwort muss mind. 8 Zeichen lang sein");
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch("/api/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPwMessage("✅ Passwort geändert!");
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch (err) {
      setPwMessage("❌ " + (err instanceof Error ? err.message : "Fehler"));
    }
    setChangingPw(false);
  };

  const deleteAccount = async () => {
    if (!confirm("ACHTUNG: Alle deine Daten werden unwiderruflich gelöscht! Fortfahren?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      signOut({ callbackUrl: "/login" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fehler");
    }
    setDeleting(false);
  };

  const exportData = async (format: "json" | "csv") => {
    const res = await fetch(`/api/export?format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ketobro-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-4xl animate-bounce">⚙️</div></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">⚙️ Einstellungen</h1>

      {message && <div className={`p-3 rounded-md text-sm ${message.includes("✅") ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-600"}`}>{message}</div>}

      {/* Dark Mode */}
      <Card>
        <CardHeader><CardTitle>🌓 Erscheinungsbild</CardTitle></CardHeader>
        <CardContent>
          <button
            onClick={toggleDarkMode}
            className="flex items-center justify-between w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div>
              <div className="font-medium">{darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Klicke zum Wechseln</div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-green-600" : "bg-gray-300"} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`} />
            </div>
          </button>
        </CardContent>
      </Card>

      {/* KI-Anbieter */}
      <Card>
        <CardHeader>
          <CardTitle>🤖 KI-Anbieter</CardTitle>
          <CardDescription>Für den KetoBro Chat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setLlmProvider("claude")} className={`flex-1 p-4 rounded-lg border-2 transition-colors ${llmProvider === "claude" ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700"}`}>
              <div className="font-semibold">☁️ Claude</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Anthropic Cloud API</div>
            </button>
            <button onClick={() => setLlmProvider("local")} className={`flex-1 p-4 rounded-lg border-2 transition-colors ${llmProvider === "local" ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700"}`}>
              <div className="font-semibold">🖥️ Lokal</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">LM Studio, Ollama</div>
            </button>
          </div>
          {llmProvider === "claude" && (
            <div className="space-y-2">
              <Label>Anthropic API Key {hasApiKey && <Badge className="ml-2">Gespeichert</Badge>}</Label>
              <Input type="password" placeholder="sk-ant-api03-..." value={anthropicApiKey} onChange={(e) => setAnthropicApiKey(e.target.value)} />
              <p className="text-xs text-gray-400">Von <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-green-600 hover:underline">console.anthropic.com</a></p>
            </div>
          )}
          {llmProvider === "local" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <Input placeholder="http://localhost:1234/v1" value={llmEndpoint} onChange={(e) => setLlmEndpoint(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Modellname</Label>
                <Input placeholder="z.B. mistral-7b" value={llmModel} onChange={(e) => setLlmModel(e.target.value)} />
              </div>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Speichern..." : "KI-Einstellungen speichern"}</Button>
        </CardContent>
      </Card>

      {/* OpenFoodFacts Info */}
      <Card>
        <CardHeader><CardTitle>🍎 OpenFoodFacts</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex gap-2 mb-2"><Badge>Kostenlos</Badge><Badge variant="secondary">Kein API Key nötig</Badge></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">Über 3 Millionen Produkte. Nutze die Produktsuche unter &quot;Erfassen → Ernährung&quot;.</p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader><CardTitle>🔑 Passwort ändern</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pwMessage && <div className={`p-2 rounded text-sm ${pwMessage.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{pwMessage}</div>}
          <div className="space-y-2"><Label>Aktuelles Passwort</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div className="space-y-2"><Label>Neues Passwort</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mind. 8 Zeichen" /></div>
          <div className="space-y-2"><Label>Neues Passwort bestätigen</Label><Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} /></div>
          <Button onClick={changePassword} disabled={changingPw} variant="outline" className="w-full">{changingPw ? "Ändern..." : "Passwort ändern"}</Button>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader><CardTitle>📦 Daten exportieren</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Lade alle deine Daten herunter (DSGVO Art. 20)</p>
          <div className="flex gap-3">
            <Button onClick={() => exportData("json")} variant="outline" className="flex-1">📄 JSON Export</Button>
            <Button onClick={() => exportData("csv")} variant="outline" className="flex-1">📊 CSV Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader><CardTitle className="text-red-600">⚠️ Account löschen</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Alle Daten werden unwiderruflich gelöscht.</p>
          <div className="space-y-2">
            <Label>Bestätige mit deiner Email-Adresse</Label>
            <Input placeholder={session?.user?.email || ""} value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} />
          </div>
          <Button onClick={deleteAccount} disabled={deleting || deleteEmail !== session?.user?.email} variant="destructive" className="w-full">
            {deleting ? "Lösche..." : "Account unwiderruflich löschen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
