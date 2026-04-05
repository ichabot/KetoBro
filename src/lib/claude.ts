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

interface LLMConfig {
  provider: "claude" | "local";
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
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "Entschuldige, ich konnte keine Antwort generieren.";
}

async function chatViaLocalLLM(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  endpoint: string,
  model: string
): Promise<string> {
  const url = endpoint.replace(/\/$/, "") + "/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "default",
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
    throw new Error("Lokales LLM Fehler: " + response.status + " - " + errText.slice(0, 200));
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Keine Antwort vom lokalen LLM.";
}

export async function chatWithKetoBro(
  messages: { role: "user" | "assistant"; content: string }[],
  userContext: UserContext,
  llmConfig: LLMConfig
): Promise<string> {
  const systemPrompt = buildSystemPrompt(userContext);

  if (llmConfig.provider === "local" && llmConfig.endpoint) {
    return chatViaLocalLLM(messages, systemPrompt, llmConfig.endpoint, llmConfig.model || "default");
  }

  // Claude (default)
  const apiKey = llmConfig.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Kein API Key konfiguriert. Bitte hinterlege deinen Anthropic API Key in den Einstellungen (⚙️).");
  }

  return chatViaClaude(messages, systemPrompt, apiKey);
}
