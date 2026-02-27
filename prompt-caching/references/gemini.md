# Google Gemini Context Caching

## Table of Contents
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [CachedContent API](#cachedcontent-api)
- [Usage and Billing](#usage-and-billing)
- [Supported Models](#supported-models)
- [Examples](#examples)

## How It Works

Google calls this **"context caching"** rather than prompt caching. Unlike Anthropic/OpenAI where caching is per-request, Gemini uses a separate **CachedContent resource** that you create, manage, and reference.

Flow:
1. Create a `CachedContent` resource with your static content
2. Reference the cached content by name in subsequent `generateContent` requests
3. Manage TTL and delete when no longer needed

## Requirements

- Minimum **32,768 tokens** to create a cached content resource
- Default TTL: **1 hour** (configurable, minimum 1 minute)
- Cached content is billed for **storage time** in addition to read discounts
- Supports: text, images, video, audio in the cached portion

## CachedContent API

### Create

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/cachedContents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_API_KEY" \
  -d '{
    "model": "models/gemini-2.0-flash",
    "displayName": "My cached context",
    "contents": [
      {
        "role": "user",
        "parts": [{"text": "...very long reference document (32k+ tokens)..."}]
      }
    ],
    "ttl": "3600s"
  }'
```

Response includes `name` (e.g., `cachedContents/abc123`) to reference later.

### Use in Generation

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GOOGLE_API_KEY" \
  -d '{
    "cachedContent": "cachedContents/abc123",
    "contents": [
      {"role": "user", "parts": [{"text": "Summarize the cached document."}]}
    ]
  }'
```

### Update TTL

```bash
curl -X PATCH "https://generativelanguage.googleapis.com/v1beta/cachedContents/abc123" \
  -H "Content-Type: application/json" \
  -d '{"ttl": "7200s"}'
```

### Delete

```bash
curl -X DELETE "https://generativelanguage.googleapis.com/v1beta/cachedContents/abc123"
```

### List

```bash
curl "https://generativelanguage.googleapis.com/v1beta/cachedContents"
```

## Usage and Billing

| Cost type | Rate |
|---|---|
| Cached input tokens | 75% discount vs standard input |
| Cache storage | Billed per token per hour |
| Output tokens | Standard rate |

No cache write premium, but storage costs accumulate. For short-lived caches (< few hours) with high reuse, cost savings are significant.

## Supported Models

- Gemini 2.0 Flash
- Gemini 1.5 Flash / Pro

## Examples

### TypeScript (Google AI SDK)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Create cached content
const cacheManager = genAI.cacheManager;
const cachedContent = await cacheManager.create({
  model: "models/gemini-2.0-flash",
  displayName: "Reference docs",
  contents: [
    {
      role: "user",
      parts: [{ text: veryLongDocument }], // must be 32k+ tokens
    },
  ],
  ttlSeconds: 3600,
});

// Use cached content in generation
const model = genAI.getGenerativeModelFromCachedContent(cachedContent);
const result = await model.generateContent(
  "What are the main themes in the document?"
);
console.log(result.response.text());

// Clean up
await cacheManager.delete(cachedContent.name);
```

### Vercel AI SDK

```typescript
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// Gemini context caching via AI SDK requires creating the cached content
// through the Google API first, then referencing it.
// The AI SDK google provider supports cachedContent in provider options:
const result = await generateText({
  model: google("gemini-2.0-flash"),
  messages: [{ role: "user", content: "Summarize the cached document." }],
  providerOptions: {
    google: { cachedContent: "cachedContents/abc123" },
  },
});
```

## Key Differences from Anthropic/OpenAI

| Aspect | Gemini | Anthropic/OpenAI |
|---|---|---|
| Cache lifecycle | Explicit create/delete | Automatic TTL per request |
| Min tokens | 32,768 | 1,024 |
| Storage cost | Yes (per token per hour) | No |
| TTL control | Full control (min 1 min) | Fixed (~5 min) |
| Multimodal caching | Yes (text, image, video, audio) | Text and images only |
| Setup complexity | Higher (separate API calls) | Lower (inline with request) |

Best for: Very large contexts (100k+ tokens) reused over longer periods (hours/days) where the 32k minimum is easily met and storage cost is justified by heavy reuse.
