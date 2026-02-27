# Anthropic Prompt Caching

## Table of Contents
- [Enabling Caching](#enabling-caching)
- [Cache Control Breakpoints](#cache-control-breakpoints)
- [Usage Tracking](#usage-tracking)
- [Supported Models](#supported-models)
- [Pricing](#pricing)
- [Examples](#examples)

## Enabling Caching

Add the beta header and `cache_control` blocks to your request:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: prompt-caching-2024-07-31" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "system": [
      {
        "type": "text",
        "text": "You are an expert assistant. Here is the reference documentation: ...(long text)...",
        "cache_control": {"type": "ephemeral"}
      }
    ],
    "messages": [
      {"role": "user", "content": "Summarize the key points."}
    ]
  }'
```

## Cache Control Breakpoints

- Add `"cache_control": {"type": "ephemeral"}` to any content block (system, user, assistant, tool_result)
- Max **4 breakpoints** per request
- Each breakpoint marks "cache everything up to and including this block"
- Content before the breakpoint must be **>= 1,024 tokens**
- Cached in **128-token increments** (content is rounded up to nearest 128-token boundary)

### Placement Strategy

```json
{
  "system": [
    {
      "type": "text",
      "text": "Base system instructions...(2000+ tokens)",
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Reference document...(5000+ tokens)",
          "cache_control": {"type": "ephemeral"}
        }
      ]
    },
    {"role": "assistant", "content": "I've reviewed the document."},
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Few-shot examples...(2000+ tokens)",
          "cache_control": {"type": "ephemeral"}
        }
      ]
    },
    {"role": "assistant", "content": "Understood."},
    {"role": "user", "content": "Now answer my actual question."}
  ]
}
```

## Usage Tracking

Response includes three token fields:

```json
{
  "usage": {
    "input_tokens": 50,
    "cache_creation_input_tokens": 2048,
    "cache_read_input_tokens": 0,
    "output_tokens": 125
  }
}
```

| Field | Meaning |
|---|---|
| `input_tokens` | Tokens processed normally (no cache) |
| `cache_creation_input_tokens` | Tokens written to cache this request (costs 1.25x base) |
| `cache_read_input_tokens` | Tokens read from cache (costs 0.1x base) |

**First request**: `cache_creation_input_tokens` > 0, `cache_read_input_tokens` = 0
**Subsequent requests (within 5 min)**: `cache_creation_input_tokens` = 0, `cache_read_input_tokens` > 0

## Supported Models

- Claude Opus 4 / Sonnet 4
- Claude 3.5 Sonnet / Haiku
- Claude 3 Haiku / Opus

## Pricing

(Per million tokens, example for Claude Sonnet 4)

| Token type | Cost |
|---|---|
| Base input | $3.00 |
| Cache write | $3.75 (1.25x) |
| Cache read | $0.30 (0.1x) |
| Output | $15.00 |

**Break-even**: Cache write pays for itself after **~1.4 cache reads** of the same content.

## Examples

### TypeScript (Anthropic SDK)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const systemContent = `You are an expert... (long system prompt)`;
const referenceDoc = `... (large reference document) ...`;

const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: systemContent,
      cache_control: { type: "ephemeral" },
    },
  ],
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: referenceDoc,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: "What are the key takeaways?",
        },
      ],
    },
  ],
});

console.log("Cache created:", response.usage.cache_creation_input_tokens);
console.log("Cache read:", response.usage.cache_read_input_tokens);
```

### Multi-Turn Conversation

```typescript
const conversationHistory: Anthropic.MessageParam[] = [];

async function chat(userMessage: string) {
  conversationHistory.push({ role: "user", content: userMessage });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: longSystemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: conversationHistory,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";
  conversationHistory.push({ role: "assistant", content: assistantMessage });

  return { text: assistantMessage, usage: response.usage };
}
```

### Tool Use with Caching

```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  tools: [
    {
      name: "search_docs",
      description: "Search documentation...",
      input_schema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
    // ... many tool definitions
    // Cache after tool definitions to avoid reprocessing them
  ],
  system: [
    {
      type: "text",
      text: "System prompt with tool usage instructions...",
      cache_control: { type: "ephemeral" },
    },
  ],
  messages: [{ role: "user", content: "Find info about caching." }],
});
```

### Vercel AI SDK

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const result = await generateText({
  model: anthropic("claude-sonnet-4-20250514", { cacheControl: true }),
  messages: [
    {
      role: "system",
      content: longSystemPrompt,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: referenceDoc,
          providerOptions: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        { type: "text", text: "Summarize this." },
      ],
    },
  ],
});
```
