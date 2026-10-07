import OpenAI from "openai";
import type { ZodType } from "zod";

// Provider is env-driven and OpenAI-compatible. Local Ollama example:
//   AI_BASE_URL=http://localhost:11434/v1
//   AI_MODEL=llama3.2
//   AI_API_KEY=ollama
const AI_BASE_URL =
  process.env.AI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta/openai/";
export const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  // AI_API_KEY is the new name; GEMINI_API_KEY is accepted as a legacy fallback.
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No API key is set on the server. Set AI_API_KEY (legacy: GEMINI_API_KEY)."
    );
  }
  client = new OpenAI({ apiKey, baseURL: AI_BASE_URL });
  return client;
}

/**
 * Strips common wrappers models add around JSON (markdown fences, stray text)
 * before attempting to parse.
 */
function extractJson(raw: string): string {
  let text = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  // If there's leading/trailing junk, try to grab the outermost {...}
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return text;
}

export interface CallJsonOptions {
  system: string;
  user: string;
  temperature?: number;
  maxRetries?: number;
}

/**
 * Calls the configured OpenAI-compatible AI provider, asking for JSON
 * output, then validates the response against the given zod schema.
 * Retries once with a stricter reminder if parsing/validation fails.
 */
export async function callJson<T>(schema: ZodType<T>, opts: CallJsonOptions): Promise<T> {
  const { system, user, temperature = 0.6, maxRetries = 1 } = opts;
  const ai = getClient();

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const messages = [
        { role: "system" as const, content: system },
        { role: "user" as const, content: user },
      ];
      if (attempt > 0) {
        messages.push({
          role: "user" as const,
          content:
            "Your previous response was not valid JSON matching the required schema. Return ONLY valid JSON this time, with no markdown fences or extra text.",
        });
      }

      const completion = await ai.chat.completions.create({
        model: AI_MODEL,
        messages,
        temperature,
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const jsonText = extractJson(raw);
      const parsed = JSON.parse(jsonText);
      const validated = schema.parse(parsed);
      return validated;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown error calling the AI provider");
}
