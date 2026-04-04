"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/chat")
        .then((r) => r.json())
        .then((data) => setMessages(data))
        .finally(() => setLoading(false));
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", content: userMessage, timestamp: new Date().toISOString() }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) throw new Error("Chat-Fehler");

      const assistantMsg = await res.json();
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: "❌ Entschuldige, es gab einen Fehler. Bitte versuche es erneut.", timestamp: new Date().toISOString() },
      ]);
    }
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🤖</div>
          <p className="text-gray-500">Chat wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">🤖 KetoBro Chat</h1>
        <p className="text-sm text-gray-500">Dein persönlicher Keto-Ernährungsberater</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <Card className="p-6 text-center bg-green-50 border-green-200">
            <div className="text-4xl mb-3">🥑</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Hallo! Ich bin KetoBro!</h3>
            <p className="text-green-700 text-sm">
              Ich bin dein persönlicher Keto-Assistent. Frag mich alles über ketogene Ernährung,
              deinen Fortschritt oder lass dir Tipps geben!
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Wie läuft mein Fortschritt?", "Was ist die Skaldeman Ratio?", "Tipps gegen Keto-Grippe"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                  className="text-xs bg-white border border-green-300 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              {msg.role === "assistant" && <div className="text-xs text-gray-400 mb-1">🥑 KetoBro</div>}
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              <div className={`text-xs mt-1 ${msg.role === "user" ? "text-green-200" : "text-gray-400"}`}>
                {new Date(msg.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-xs text-gray-400 mb-1">🥑 KetoBro</div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Schreibe eine Nachricht..."
          className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px] max-h-[120px]"
          rows={1}
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          {sending ? "⏳" : "📤"}
        </Button>
      </form>
    </div>
  );
}
