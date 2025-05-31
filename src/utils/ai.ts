/**
 * Generates text using OpenAI's GPT-4o-mini model.
 *
 * @param prompt The prompt to generate text from.
 * @param modelName The model to use. Defaults to "gpt-4o-mini".
 * @returns The generated text.
 */

// Documentation Vercel: https://ai-sdk.js.org/docs/ai-sdk-openai
// Documentation Vercel: https://ai-sdk.dev/docs/guides/openai-responses
// Documentation OpenAI: https://platform.openai.com/docs/guides/text?api-mode=responses

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateAiText(prompt: string, modelName: string = "gpt-4o-mini") {
  const model = openai.responses(modelName);

  const { text } = await generateText({
    model,
    prompt,
  });

  return text;
}
