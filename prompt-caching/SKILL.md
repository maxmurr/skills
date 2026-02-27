---
name: prompt-caching
description: Implements LLM prompt caching (KV caching) for Anthropic, OpenAI, and Google Gemini APIs. Use when optimizing LLM API costs with cached prompts, reducing time-to-first-token latency, adding cache_control breakpoints, debugging cached vs uncached token usage, or structuring prompts for maximum cache hit rates. Do not use for HTTP response caching, CDN or browser caching, Redis or in-memory application caching, LLM fine-tuning, embedding caching, or general API integration without caching concerns.
---

# Prompt Caching

## What Gets Cached

Prompt caching = **KV caching**. The provider stores K (key) and V (value) matrices from the attention mechanism between requests. When a new request shares a prefix with a cached prompt, the provider reuses stored matrices instead of recomputing them:
- **Up to 90% cost reduction** on cached input tokens
- **Up to 85% latency reduction** (time-to-first-token) for long prompts

Cache matching is **prefix-based** -- partial matches work. Temperature, top_p, top_k do not affect caching (they act after attention).

## Provider Comparison

| | Anthropic | OpenAI | Google Gemini |
|---|---|---|---|
| **Caching mode** | Explicit (opt-in) | Automatic | Explicit (opt-in) |
| **Min tokens** | 1,024 | 1,024 | 32,768 |
| **Granularity** | 128-token blocks | 128-token blocks | -- |
| **Default TTL** | 5 min | ~5-10 min | Configurable (min 1 min) |
| **Cache write cost** | 25% more than base | Free | Varies by model |
| **Cache read cost** | 90% less than base | 50-75% less than base | 75% less than base |
| **Hit rate** | ~100% when explicit | ~50% on immediate resend | ~100% when explicit |
| **Max breakpoints** | 4 per request | N/A (automatic) | N/A |

## Procedure

### Step 1: Identify the Target Provider

Examine the codebase for SDK imports:

- If code imports `@anthropic-ai/sdk` or `anthropic` → **Anthropic**. Read [references/anthropic.md](references/anthropic.md).
- If code imports `openai` → **OpenAI**. Read [references/openai.md](references/openai.md).
- If code imports `@google/generative-ai` or `@ai-sdk/google` → **Google Gemini**. Read [references/gemini.md](references/gemini.md).
- If code uses Vercel AI SDK (`ai`) → check which provider adapter is imported (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`) and read the corresponding reference.
- If no SDK is present or provider is unclear → ask the user which provider they target before proceeding.

### Step 2: Analyze Existing Prompt Structure

Examine the current prompt construction:

1. Map each part of the prompt to stability tiers:
   - **Tier 1 (static):** system prompt, tool definitions
   - **Tier 2 (semi-static):** reference documents, few-shot examples
   - **Tier 3 (dynamic):** conversation history, user messages
2. Check whether content is ordered from most stable to least stable (required for cache hits).
3. Identify any dynamic content (timestamps, request IDs, UUIDs) injected before static content — this invalidates caching.
4. Verify total token count of static content meets the provider minimum (1,024 for Anthropic/OpenAI, 32,768 for Gemini).

### Step 3: Restructure Prompts for Maximum Cache Hits

Reorder prompt content from **most stable to least stable**:

```
1. System prompt (rarely changes)          ← cache breakpoint here
2. Long reference material / documents     ← cache breakpoint here
3. Few-shot examples                       ← cache breakpoint here
4. Conversation history (grows each turn)
5. Current user message (always changes)
```

Apply these rules:
- Place all static content at the beginning — caching is prefix-based.
- Keep identical prefixes across requests — a single changed character before a cache boundary invalidates everything after it.
- For multi-turn conversations, cache the system prompt + context and let the conversation tail vary.
- Move any dynamic content (timestamps, IDs) after the last cache boundary.

### Step 4: Add Provider-Specific Cache Configuration

**If Anthropic:**
1. Add `cache_control: { type: "ephemeral" }` to content blocks after each stable section.
2. Place breakpoints after system prompt, reference material, and few-shot examples (max 4 breakpoints per request).
3. Ensure content before each breakpoint is >= 1,024 tokens.

**If OpenAI:**
1. No configuration needed — caching is automatic.
2. Maximize hit rate by keeping prefixes identical, batching requests within the TTL window, and keeping tool definitions in stable order.

**If Google Gemini:**
1. Create a `CachedContent` resource via the API with static content (must be >= 32,768 tokens).
2. Set an appropriate TTL based on expected reuse pattern.
3. Reference the cached content by name in subsequent `generateContent` requests.
4. Delete the cached content when no longer needed to stop storage billing.

### Step 5: Add Usage Monitoring

Add logging to track cache effectiveness:

**Anthropic:** Log `cache_creation_input_tokens` and `cache_read_input_tokens` from `response.usage`.
**OpenAI:** Log `cached_tokens` from `response.usage.prompt_tokens_details`.
**Gemini:** Compare billed token counts between cached and uncached requests.

Evaluate results:
- If cache reads are low relative to cache writes → restructure prompts or check request timing against TTL.
- If Anthropic cache write costs exceed savings → the prefix is not reused enough to justify explicit caching.
- If OpenAI hit rate is consistently low → consider switching to Anthropic's explicit caching for predictable behavior.

## Common Pitfalls

- **Dynamic content before static content** — invalidates the entire cache prefix.
- **Below minimum token thresholds** — content under 1,024 tokens (Anthropic/OpenAI) or 32,768 tokens (Gemini) will not cache.
- **Expecting predictable OpenAI cache hits** — automatic routing yields ~50% hit rate. Use Anthropic's explicit approach when predictable caching is required.
- **Ignoring Anthropic cache write costs** — first request costs 1.25x base input. Only profitable if the same prefix is reused (break-even after ~1.4 reads).
- **Changing message role boundaries** — even if text is identical, restructuring into different message objects breaks the prefix match.
- **Gemini storage cost accumulation** — cached content is billed per token per hour. Delete cached content promptly when no longer needed.
