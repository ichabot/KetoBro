import Anthropic from "@anthropic-ai/sdk";

interface UserContext {
  name?: string | null;
  height?: number | null;
  gender?: string | null;
  age?: number | null;
  activityLevel?: string | null;
  latestWeight?: number | null;
  weightChange?: number | null;
  latestNetCarbs?: number | null;
  latestSkaldemanRatio?: number | null;
  ketosisStatus?: string | null;
  bmr?: number | null;
  tdee?: number | null;
}

export interface LLMConfig {
  provider: string; // claude | openai | mistral | gemini | local
  apiKey?: string | null;
  endpoint?: string | null;
  model?: string | null;
}

function genderLabel(g: string | null | undefined): string {
  if (g === "male") return "männlich";
  if (g === "female") return "weiblich";
  return "divers";
}

function buildSystemPrompt(ctx: UserContext): string {
  const lines: string[] = [
    "Du bist KetoBro, ein freundlicher und motivierender KI-Assistent für ketogene Ernährung.",
    "",
    "DEINE PERSÖNLICHKEIT:",
    "- Du sprichst Deutsch mit korrekten Umlauten",
    "- Du bist motivierend, aber sachlich bei Gesundheitsfragen",
    "- Du ermutigst bei Rückschlägen",
    "- Du verwendest gelegentlich passende Emojis",
    "- Du gibst KEINE medizinischen Diagnosen, sondern empfiehlst bei Bedenken einen Arzt",
    "",
    "BENUTZERDATEN:",
  ];

  if (ctx.name) lines.push("- Name: " + ctx.name);
  if (ctx.height) lines.push("- Größe: " + ctx.height + " cm");
  if (ctx.gender) lines.push("- Geschlecht: " + genderLabel(ctx.gender));
  if (ctx.age) lines.push("- Alter: " + ctx.age + " Jahre");
  if (ctx.activityLevel) lines.push("- Aktivitätslevel: " + ctx.activityLevel);
  if (ctx.latestWeight) lines.push("- Aktuelles Gewicht: " + ctx.latestWeight + " kg");
  if (ctx.weightChange !== undefined && ctx.weightChange !== null) {
    const prefix = ctx.weightChange > 0 ? "+" : "";
    lines.push("- Gewichtsveränderung: " + prefix + ctx.weightChange + " kg");
  }
  if (ctx.bmr) lines.push("- Grundumsatz (BMR): " + Math.round(ctx.bmr) + " kcal");
  if (ctx.tdee) lines.push("- Gesamtumsatz (TDEE): " + ctx.tdee + " kcal");
  if (ctx.latestNetCarbs !== undefined && ctx.latestNetCarbs !== null) {
    lines.push("- Letzte Netto-Carbs: " + ctx.latestNetCarbs + "g");
  }
  if (ctx.ketosisStatus) lines.push("- Ketose-Status: " + ctx.ketosisStatus);
  if (ctx.latestSkaldemanRatio) lines.push("- Skaldeman Ratio: " + ctx.latestSkaldemanRatio);

  lines.push("");
  lines.push("DEIN WISSEN:");
  lines.push("- Ketose: Metabolischer Zustand, Fett als primäre Energiequelle");
  lines.push("- Netto-Carbs (Europa): Kohlenhydrate minus Ballaststoffe");
  lines.push("- Skaldeman Ratio: Fett(g) / (Protein(g) + Netto-Carbs(g)), optimal 1.0-2.0");
  lines.push("- Keto-Makros: 70-75% Fett, 20-25% Protein, 5-10% Carbs");
  lines.push("- Blutketone: >0.5 mmol/L = Ketose, optimal 1.5-3.0 mmol/L");
  lines.push("- Keto-Grippe: Vorübergehend (1-2 Wochen), Elektrolyte wichtig (Na, K, Mg)");
  lines.push("");
  lines.push("Antworte immer auf Deutsch. Halte Antworten informativ aber nicht zu lang.");

  return lines.join("\n");
}

// Provider endpoint + default model mapping
const PROVIDER_CONFIG: Record<string, { endpoint: string; defaultModel: string }> = {
  openai: { endpoint: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  mistral: { endpoint: "https://api.mistral.ai/v1", defaultModel: "mistral-large-latest" },
  gemini: { endpoint: "https://generativelanguage.googleapis.com/v1beta/openai", defaultModel: "gemini-2.0-flash" },
  deepseek: { endpoint: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat" },
};

async function chatViaClaude(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "Entschuldige, ich konnte keine Antwort generieren.";
}

async function chatViaOpenAICompat(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  endpoint: string,
  model: string,
  apiKey?: string
): Promise<string> {
  const url = endpoint.replace(/\/$/, "") + "/chat/completions";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error("LLM API Fehler (" + response.status + "): " + errText.slice(0, 200));
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Keine Antwort erhalten.";
}

export async function chatWithKetoBro(
  messages: { role: "user" | "assistant"; content: string }[],
  userContext: UserContext,
  llmConfig: LLMConfig
): Promise<string> {
  const systemPrompt = buildSystemPrompt(userContext);
  const provider = llmConfig.provider || "claude";

  // Local LLM (custom endpoint)
  if (provider === "local") {
    if (!llmConfig.endpoint) throw new Error("Kein LLM-Endpoint konfiguriert. Bitte unter Einstellungen (⚙️) hinterlegen.");
    return chatViaOpenAICompat(messages, systemPrompt, llmConfig.endpoint, llmConfig.model || "default");
  }

  // Cloud providers with OpenAI-compatible API
  if (provider in PROVIDER_CONFIG) {
    const config = PROVIDER_CONFIG[provider];
    if (!llmConfig.apiKey) throw new Error("Kein API Key für " + provider.charAt(0).toUpperCase() + provider.slice(1) + " hinterlegt. Bitte unter Einstellungen (⚙️) konfigurieren.");
    const model = llmConfig.model || config.defaultModel;
    return chatViaOpenAICompat(messages, systemPrompt, config.endpoint, model, llmConfig.apiKey);
  }

  // Claude (default) — uses native Anthropic SDK
  const apiKey = llmConfig.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Kein API Key konfiguriert. Bitte hinterlege deinen API Key in den Einstellungen (⚙️).");
  return chatViaClaude(messages, systemPrompt, apiKey);
}
