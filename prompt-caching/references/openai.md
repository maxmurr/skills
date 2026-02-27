# OpenAI Prompt Caching

## Table of Contents
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [Usage Tracking](#usage-tracking)
- [Supported Models](#supported-models)
- [Pricing](#pricing)
- [Examples](#examples)

## How It Works

OpenAI prompt caching is **fully automatic**. No configuration, headers, or opt-in required.

- OpenAI attempts to route your request to a server holding cached KV for your prompt prefix
- **~50% hit rate** on immediate resend (empirically observed) -- not guaranteed
- No control over when caching happens or which prefix is cached
- Cache persists for **5-10 minutes** of inactivity (not documented precisely)

## Requirements

- Prompt prefix must be **>= 1,024 tokens** to be eligible
- Cached in **128-token increments** after the initial 1,024
- Prefix matching is exact -- identical content and message structure required
- Same `model`, same `messages` prefix, same `tools` definition order

## Usage Tracking

Check the `usage` object in the response:

```json
{
  "usage": {
    "prompt_tokens": 2048,
    "completion_tokens": 150,
    "prompt_tokens_details": {
      "cached_tokens": 1920
    }
  }
}
```

| Field | Meaning |
|---|---|
| `prompt_tokens` | Total input tokens |
| `cached_tokens` | Tokens served from cache (subset of prompt_tokens) |
| `completion_tokens` | Output tokens |

**No separate cache write cost.** OpenAI does not charge extra for populating the cache.

## Supported Models

- GPT-4o, GPT-4o-mini (and dated variants)
- o1, o1-mini, o1-preview
- GPT-4 (all variants)
- GPT-3.5 Turbo

## Pricing

(Example for GPT-4o)

| Token type | Cost per 1M tokens |
|---|---|
| Input | $2.50 |
| Cached input | $1.25 (50% discount) |
| Output | $10.00 |

No cache write premium. Discount is 50% for most models (some get 75% off for cached reads).

## Examples

### TypeScript (OpenAI SDK)

```typescript
import OpenAI from "openai";

const client = new OpenAI();

const longSystemPrompt = `You are an expert... (long prompt)`;

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: longSystemPrompt },
    { role: "user", content: "What are the key points?" },
  ],
});

const cached = response.usage?.prompt_tokens_details?.cached_tokens ?? 0;
console.log(`Cached tokens: ${cached} / ${response.usage?.prompt_tokens}`);
```

### Maximizing Hit Rate

Since caching is automatic, maximize hits by:

1. **Keep identical prefixes** across requests in a session
2. **Batch requests** -- send multiple requests quickly to hit the same cached server
3. **Stable tool definitions** -- keep tools in the same order across requests
4. **Don't restructure messages** -- even splitting the same text into different message objects breaks the prefix

```typescript
// GOOD: stable prefix, variable suffix
const messages = [
  { role: "system", content: STABLE_SYSTEM_PROMPT },
  { role: "user", content: STABLE_CONTEXT_DOC },
  { role: "assistant", content: "I've reviewed the document." },
  { role: "user", content: variableUserQuery }, // only this changes
];

// BAD: variable content injected early
const messages = [
  {
    role: "system",
    content: `Current time: ${new Date().toISOString()}\n${SYSTEM_PROMPT}`,
  },
  { role: "user", content: userQuery },
];
```

### Vercel AI SDK

No special configuration needed -- caching happens automatically:

```typescript
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const result = await generateText({
  model: openai("gpt-4o"),
  system: longSystemPrompt,
  messages: [{ role: "user", content: "Summarize the document." }],
});
```
