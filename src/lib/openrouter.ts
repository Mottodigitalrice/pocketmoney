import OpenAI from "openai";

// Available models - update as needed
export const MODELS = {
  // Fast & cheap (for simple tasks)
  fast: "openai/gpt-4o-mini",

  // Smart (for complex reasoning)
  smart: "anthropic/claude-3.5-sonnet",

  // Creative (for writing)
  creative: "anthropic/claude-3-opus",

  // Japanese-optimized
  japanese: "openai/gpt-4o",
} as const;

export type ModelKey = keyof typeof MODELS;

// Lazy-load OpenRouter client (avoids build-time errors when API key not set)
let _openrouter: OpenAI | null = null;

function getOpenRouter(): OpenAI {
  if (!_openrouter) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }
    _openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });
  }
  return _openrouter;
}

// Helper function for chat completions
export async function chat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model: ModelKey = "fast"
) {
  const response = await getOpenRouter().chat.completions.create({
    model: MODELS[model],
    messages,
  });

  return response.choices[0]?.message?.content || "";
}

// Helper function for streaming
export async function chatStream(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  model: ModelKey = "fast"
) {
  return await getOpenRouter().chat.completions.create({
    model: MODELS[model],
    messages,
    stream: true,
  });
}
