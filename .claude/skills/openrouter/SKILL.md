---
name: openrouter
description: Use this skill when integrating AI capabilities—model selection, chat completions, streaming responses, and cost optimization with OpenRouter API.
---

# OpenRouter AI Skill

## Overview
This project uses OpenRouter for AI capabilities. OpenRouter provides access to 100+ models through one API.

## Setup
Already configured in `src/lib/openrouter.ts`.

## Available Models
```typescript
const MODELS = {
  fast: "openai/gpt-4o-mini",        // Quick, cheap
  smart: "anthropic/claude-3.5-sonnet", // Complex reasoning
  creative: "anthropic/claude-3-opus",  // Creative writing
  japanese: "openai/gpt-4o",            // Japanese language
};
```

## Usage

### Server-Side (API Route)
```typescript
import { chat, chatStream } from "@/lib/openrouter";

// Simple completion
const response = await chat([
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Hello!" }
], "fast");

// Streaming
const stream = await chatStream(messages, "smart");
for await (const chunk of stream) {
  console.log(chunk.choices[0]?.delta?.content);
}
```

### Client-Side (via API)
```typescript
const response = await fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello!" }],
    model: "fast",
    stream: false,
  }),
});

const data = await response.json();
console.log(data.content);
```

### Streaming on Client
```typescript
const response = await fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello!" }],
    model: "smart",
    stream: true,
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  console.log(text); // Stream text as it arrives
}
```

## Environment Variables
```env
OPENROUTER_API_KEY=sk-or-...
```

## Get API Key
1. Go to https://openrouter.ai/keys
2. Create new key
3. Add to `.env.local`

## Cost Optimization
- Use `fast` model for simple tasks (summarization, classification)
- Use `smart` model for complex reasoning
- Use `japanese` model for Japanese language tasks
- Monitor usage at https://openrouter.ai/usage
