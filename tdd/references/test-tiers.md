# Test Tiers

Two tiers, two runners, one boundary rule.

## Unit Tests

**Environment**: Node (no browser, no DOM)
**Scope**: Pure domain logic + adapter boundary tests

What belongs here:
- Domain services with no UI (`getWorkInterval`, `evaluateAnswer`, `getRandomRiddle`)
- Adapter tests with MSW intercepting HTTP (`fetchRiddles`, `fetchRiddle`)
- Adapter tests with module mocks for third-party SDKs (`fetchCorrectAnswer`)

```
src/__tests__/
  WorkIntervalService.test.ts    ← pure logic
  RiddleService.test.ts          ← pure logic
  RiddleExamService.test.ts      ← pure logic
  TimestampService.test.ts       ← pure logic
  RiddleAdapter.test.ts          ← boundary (MSW)
  RiddleExamAdapter.test.ts      ← boundary (module mock)
```

Fast, no browser, no DOM. These tests run in milliseconds.

## Component Tests

**Environment**: Browser (real DOM, real rendering)
**Scope**: Mounted UI with intercepted boundaries

What belongs here:
- User-visible behavior: click, navigate, see result
- State transitions: loading → success, pending → correct/wrong
- Integration between components, routing, and data fetching

```
src/__tests__/
  AppBoot.test.tsx               ← smoke test
  RandomRiddle.test.tsx          ← navigation flow
  SolveRiddle.test.tsx           ← interaction + async states
```

These mount real component trees with real routing. Only system boundaries (HTTP, external SDKs) are faked via interceptors or dependency injection.

Any component testing tool works: Cypress component testing, Playwright component testing, Testing Library + jsdom, etc. See [component-testing.md](component-testing.md) for patterns.

## When to Use Which

| Signal | Tier |
|--------|------|
| No DOM, no React, no browser APIs | Unit |
| Pure function: input → output | Unit |
| Adapter wrapping fetch/SDK | Unit (MSW or `vi.mock`) |
| User clicks something and sees a result | Component |
| Need to verify async state transitions (pending → done) | Component |
| Navigation between routes | Component |
| Smoke test: does the app render? | Component |

## The Split Convention

Separate tiers by file extension or directory so each runner picks up its own tests. Example:

- `*.test.ts` → unit runner (node env)
- `*.test.tsx` → component runner (browser env)

Same `__tests__/` directory, zero ambiguity about which runner owns which file. Configure each runner's include/exclude patterns to match.
