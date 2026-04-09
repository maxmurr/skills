---
name: writing-evals
description: Write evaluation suites using evalite. Generates .eval.ts files, scorers, and test data from code inspection. Use when creating evals, writing scorers, benchmarking AI capabilities, or setting up evalite in a package.
license: MIT
compatibility: Any TypeScript project with evalite installed.
metadata:
  author: maxmurr
  version: "1.0"
---

# Writing Evals

You write evaluations that prove AI capabilities work. Evals are the test suite for non-deterministic systems — they measure whether a capability still behaves correctly after every change.

**If the task function uses the Vercel AI SDK**, load the `ai-sdk` skill for correct `generateText`/`streamText` patterns.

## Philosophy

1. **Evals are tests for AI.** Every eval answers: "does this capability still work?"
2. **Scorers are assertions.** Each scorer checks one property of the output.
3. **Data drives coverage.** Happy path, adversarial, boundary, and negative cases.
4. **Read code first, ask later.** Inspect the codebase and infer everything you can before asking.

---

## How to Start

When the user asks you to write evals for an AI feature, **read the code first**.

### Step 1: Understand the feature

1. **Find the AI function** — search for the function the user mentioned. Read it fully.
2. **Trace the inputs** — what data goes in? A string prompt, structured object, conversation history?
3. **Trace the outputs** — what comes back? A string, category label, structured object, tool calls?
4. **Identify the model call** — which LLM/model is used? What parameters?
5. **Check for existing evals** — search for `*.eval.ts` files. Don't duplicate what exists.

### Step 2: Determine eval type

| Output type | Eval type | Scorer pattern |
|-------------|-----------|----------------|
| String category/label | Classification | `exactMatch` |
| Free-form text | Text quality | `levenshtein` or LLM-as-judge |
| Array of items | Retrieval/RAG | Set match + `faithfulness` |
| Structured object | Structured output | Field-by-field validation |
| Tool calls / agent result | Tool use | `toolCallAccuracy` |

### Step 3: Choose scorers

Every eval needs **at least 2 scorers**. Layer them:

1. **Correctness (required)** — Does the output match expected? Pick from the eval type table above.
2. **Quality (recommended)** — Is the output well-formed? Check format, completeness, confidence.
3. **Reference-free (for user-facing text)** — Is the output coherent, relevant? Use LLM-as-judge via custom scorer.

| Output type | Minimum scorers |
|-------------|----------------|
| Category label | `exactMatch` + confidence threshold |
| Free-form text | `levenshtein` + coherence (LLM-as-judge) |
| Structured object | Field match + field completeness |
| Tool calls | `toolCallAccuracy` + argument validation |
| Retrieval results | Set match + `faithfulness` |

### Step 4: Generate

1. Create the `.eval.ts` file **colocated next to the source file**
2. Import the actual function — do not create a stub
3. Write scorers (minimum 2, see step 3)
4. Generate test data (see Data Design Guidelines)
5. Ensure `evalite` and `vitest` are dev dependencies in the package

### Only ask if you cannot determine:
- What "correct" means for ambiguous outputs (e.g., summarization quality)
- Whether the user wants pass/fail or partial credit scoring

---

## Reference

For detailed patterns and type signatures, read these on demand:

- `references/api-reference.md` — Full type signatures, import paths, built-in scorers, CLI
- `references/templates/` — Ready-to-use eval file templates (see below)

### Templates

| Template | File | Use case |
|----------|------|----------|
| Minimal | `references/templates/minimal.md` | Simplest starting point |
| Classification | `references/templates/classification.md` | Category labels |
| Retrieval/RAG | `references/templates/retrieval.md` | Document retrieval, RAG |
| Structured output | `references/templates/structured-output.md` | JSON object validation |
| Tool use | `references/templates/tool-use.md` | Agent tool-call validation |

---

## Data Design Guidelines

### Step 1: Check for existing data

Before generating test data:

1. **Search the codebase** — look for JSON/CSV files, seed data, test fixtures, or existing `data:` arrays
2. **Ask the user** — "Do you have an eval dataset or example inputs/outputs?"

If the user has data, use it directly or load with dynamic data: `data: async () => [...]`.

### Step 2: Generate test data from code

If no data exists, generate it by reading the AI feature's code:

1. **Read the system prompt** — it defines valid outputs. Extract categories, labels, expected behavior.
2. **Read the input type** — generate realistic examples of that shape.
3. **Read any validation/parsing** — tells you what correct output looks like.
4. **Look at constants/enums** — if the feature classifies, use those as expected values.

### Step 3: Cover all categories

| Category | What to generate |
|----------|-----------------|
| **Happy path** | Clear, unambiguous inputs with obvious correct answers |
| **Adversarial** | Prompt injection, misleading inputs |
| **Boundary** | Empty input, ambiguous intent, mixed signals |
| **Negative** | Inputs that should return empty/unknown/no-tool |

**Minimum:** 5-8 cases for a basic eval. 15-20 for production coverage.

Always add metadata for categorization:
```typescript
{ input: "...", expected: "...", metadata: { purpose: "happy-path" } }
```

---

## Guardrails

- **Don't guess import paths** — read `node_modules/evalite` types if unsure
- **Don't create stubs** — import the real function being evaluated
- **Don't skip scorers** — minimum 2 per eval, no exceptions
- **Don't duplicate evals** — check for existing `*.eval.ts` files first
- **Do colocate** — `.eval.ts` next to the source file it tests
- **Do read code first** — never write evals from assumptions
- **Do ensure deps** — `evalite` and `vitest` must be dev dependencies in the target package
