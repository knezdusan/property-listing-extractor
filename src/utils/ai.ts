// src/utils/ai.ts
import { generateText, generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// LLM Models (https://console.groq.com/dashboard/limits)
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_LLM_MODELS = {
  Llama: "meta-llama/llama-4-scout-17b-16e-instruct",
  Kim2: "moonshotai/kimi-k2-instruct",
};

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: GROQ_API_KEY,
});

/**
 * Generate text with **automatic failover**.
 *  1. primary model    → Llama (500 k tokens/day) - Better for longer, detailed content
 *  2. fallback model   → Kim2  (300 k tokens/day) - Better for short, concise responses
 *
 * @param prompt  The prompt to send.
 * @param maxTokens  Maximum tokens to generate (default: 512)
 * @param temperature Controls randomness: lower values are more deterministic, higher more creative (default: 0.6)
 * @param frequencyPenalty Reduces repetition of token sequences (default: 0.3)
 * @returns       Plain text from whichever model succeeded.
 */
export async function generateAiText(
  prompt: string,
  maxTokens: number = 512,
  temperature: number = 0.6,
  frequencyPenalty: number = 0.3
): Promise<string | null> {
  const primary = GROQ_LLM_MODELS.Llama;
  const fallback = GROQ_LLM_MODELS.Kim2;

  for (const modelSlug of [primary, fallback]) {
    try {
      const model = groq(modelSlug);
      // Use optimal parameters for generating descriptive content
      const { text, warning }: { text: string; warning?: string } = await generateText({
        model,
        prompt,
        maxTokens,
        temperature,
        frequencyPenalty,
      });

      if (warning) {
        console.log("warning", warning);
      }
      return text; // success
    } catch (err: unknown) {
      // 429 (rate-limit) or 402/403 (quota) → try next
      let code: number | undefined;
      if (typeof err === "object" && err !== null) {
        if ("statusCode" in err && typeof (err as { statusCode?: number }).statusCode === "number") {
          code = (err as { statusCode: number }).statusCode;
        } else if (
          "response" in err &&
          typeof (err as { response?: { status?: number } }).response?.status === "number"
        ) {
          code = (err as { response: { status: number } }).response.status;
        }
      }
      if ([402, 403, 429].includes(code!)) continue;
      // any other error (network, 500…) re-throw
      console.error("❌ Failed to generate text with automatic failover", err);
      return null;
    }
  }

  // Both models failed → surface a clear error
  console.error("❌ Both Kim2 and Llama quotas exhausted.");
  return null;
}

/**
 * Generate structured data with **automatic failover**.
 *  1. primary model    → Llama (500 k tokens/day) - Better for longer, detailed content
 *  2. fallback model   → Kim2  (300 k tokens/day) - Better for short, concise responses
 *
 * @param prompt  The prompt to send.
 * @param schema  The Zod schema defining the structure of the object to generate.
 * @param schemaName  Optional name for the schema (helps guide the LLM).
 * @param schemaDescription  Optional description for the schema (helps guide the LLM).
 * @param maxTokens  Maximum tokens to generate (default: 1024)
 * @param temperature Controls randomness: lower values are more deterministic (default: 0.2)
 * @param frequencyPenalty Reduces repetition of token sequences (default: 0)
 * @returns  Structured object from whichever model succeeded, or null on failure.
 */
export async function generateAIObject<T extends z.ZodType>(
  prompt: string,
  schema: T,
  schemaName?: string,
  schemaDescription?: string,
  maxTokens: number = 1024,
  temperature: number = 0.2,
  frequencyPenalty: number = 0
): Promise<z.infer<T> | null> {
  const primary = GROQ_LLM_MODELS.Llama;
  const fallback = GROQ_LLM_MODELS.Kim2;

  for (const modelSlug of [primary, fallback]) {
    try {
      const model = groq(modelSlug);
      const { object } = await generateObject({
        model,
        prompt,
        schema,
        ...(schemaName && { schemaName }),
        ...(schemaDescription && { schemaDescription }),
        maxTokens,
        temperature,
        ...(frequencyPenalty > 0 && { frequencyPenalty }),
      });

      return object; // success
    } catch (err: unknown) {
      // 429 (rate-limit) or 402/403 (quota) → try next
      let code: number | undefined;
      if (typeof err === "object" && err !== null) {
        if ("statusCode" in err && typeof (err as { statusCode?: number }).statusCode === "number") {
          code = (err as { statusCode: number }).statusCode;
        } else if (
          "response" in err &&
          typeof (err as { response?: { status?: number } }).response?.status === "number"
        ) {
          code = (err as { response: { status: number } }).response.status;
        }
      }
      if ([402, 403, 429].includes(code!)) continue;
      // any other error (network, 500…) re-throw
      console.error("❌ Failed to generate structured data with automatic failover", err);
      return null;
    }
  }

  // Both models failed → surface a clear error
  console.error("❌ Both Kim2 and Llama quotas exhausted.");
  return null;
}
