# Evalite API Reference

> **Version:** 1.0.0-beta.16 | **Docs:** https://v1.evalite.dev
> If behavior diverges, check `node_modules/evalite/dist/*.d.ts` for exact types.

## Installation

```bash
pnpm add -D evalite vitest
```

Add to `package.json`:
```json
{ "scripts": { "eval:dev": "evalite watch" } }
```

## Import Paths

```typescript
import { evalite } from "evalite";
import { createScorer } from "evalite/scorer";
import { exactMatch, levenshtein, faithfulness, toolCallAccuracy } from "evalite/scorers";
```

---

## `evalite()`

```typescript
evalite<TInput, TOutput, TExpected = TOutput>(
  evalName: string,
  opts: {
    data: Array<{ input: TInput; expected?: TExpected; only?: boolean }>
      | (() => Promise<Array<{ input: TInput; expected?: TExpected; only?: boolean }>>);
    task: (input: TInput) => Promise<TOutput> | TOutput;
    scorers?: Array<Scorer | ScorerOpts>;
    columns?: (opts: { input: TInput; output: TOutput; expected?: TExpected }) =>
      Promise<Array<{ label: string; value: string }>> | Array<{ label: string; value: string }>;
    trialCount?: number;
  }
): void
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `evalName` | `string` | Yes | Name displayed in UI and test output |
| `opts.data` | `Array \| () => Promise<Array>` | Yes | Test cases; static array or async loader |
| `opts.task` | `(input) => Promise<TOutput>` | Yes | The function being evaluated |
| `opts.scorers` | `Array<Scorer>` | No | Scoring functions (0-1 scale) |
| `opts.columns` | `Function` | No | Custom UI columns for metadata display |
| `opts.trialCount` | `number` | No | Repeat count per case (default: 1) |

### Variants

- **`evalite.skip()`** — bypass an eval
- **`evalite.each()`** — run variants (compare models, prompts, etc.)

---

## `createScorer()`

```typescript
createScorer<TInput, TOutput, TExpected = TOutput>(opts: {
  name: string;
  description?: string;
  scorer: (input: {
    input: TInput;
    output: TOutput;
    expected?: TExpected;
  }) => Promise<number | { score: number; metadata?: unknown }>
     | number
     | { score: number; metadata?: unknown };
}): Scorer<TInput, TOutput, TExpected>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `opts.name` | `string` | Yes | Scorer name in UI |
| `opts.description` | `string` | No | What this scorer checks |
| `opts.scorer` | `Function` | Yes | Returns 0-1 score, sync or async |

### Return value

The scorer function must return:
- **`number`** — a score between 0 and 1
- **`{ score: number; metadata?: unknown }`** — score with optional metadata for UI

---

## Built-in Scorers

Import from `evalite/scorers`:

| Scorer | Type | Use case |
|--------|------|----------|
| `exactMatch` | Reference-based | Exact string/value equality |
| `levenshtein` | Reference-based | Fuzzy string similarity |
| `answerCorrectness` | Reference-based | Semantic correctness |
| `answerRelevancy` | Reference-free | Output relevance to input |
| `answerSimilarity` | Reference-based | Semantic similarity |
| `contains` | Reference-based | Substring presence |
| `contextRecall` | Reference-based | RAG context coverage |
| `faithfulness` | Reference-based | RAG output grounded in context |
| `noiseSensitivity` | Reference-based | Robustness to input noise |
| `toolCallAccuracy` | Reference-based | Tool name + args validation |

---

## CLI Commands

| Command | Purpose |
|---------|---------|
| `evalite watch` | Watch mode — reruns on file change, launches UI at :3006 |
| `evalite` | Single run, outputs summary |

Results are stored in SQLite at `node_modules/.evalite`.

---

## Data Shape

```typescript
interface DataItem<TInput, TExpected> {
  input: TInput;
  expected?: TExpected;
  only?: boolean;       // run only this case (dev mode)
}
```

### Dynamic data loading

```typescript
evalite("My Eval", {
  data: async () => {
    const cases = await loadFromFile("./fixtures/cases.json");
    return cases;
  },
  // ...
});
```

---

## Inline Scorer (no `createScorer`)

For one-off scorers within a single eval:

```typescript
scorers: [
  {
    name: "My Check",
    description: "Validates output format",
    scorer: ({ output }) => {
      return output.startsWith("{") ? 1 : 0;
    },
  },
],
```
