# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

## Classical TDD (Default)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Outside-In TDD

In outside-in, mocking collaborators **you control** is a design tool, not a testing shortcut.

Allowed:

- Direct collaborators that **don't exist yet** (mock to discover their interface)
- Direct collaborators one layer down (not transitive)

Still don't mock:

- Transitive dependencies (only mock your direct neighbor)
- Concrete implementations that already exist and work
- Anything to avoid writing a real implementation

**Mocks are temporary.** Every mock of something you control should eventually be replaced by the real implementation. If a mock for an internal collaborator persists in the final test suite, something went wrong.

See [outside-in.md](outside-in.md) for the full workflow.

## MSW for HTTP Boundaries

Use [MSW](https://mswjs.io/) (Mock Service Worker) to intercept HTTP at the network level. Tests hit your real adapter code; only the network is faked.

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { fetchRiddles } from '../RiddleAdapter';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchRiddles', () => {
  it('returns riddles from the API', async () => {
    server.use(
      http.get('http://localhost:3000/riddles', () => {
        return HttpResponse.json([{ id: '1', contents: 'Why?' }]);
      }),
    );

    const result = await fetchRiddles();

    expect(result).toEqual([{ id: '1', contents: 'Why?' }]);
  });

  it('throws on server error', async () => {
    server.use(
      http.get('http://localhost:3000/riddles', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(fetchRiddles()).rejects.toThrow();
  });
});
```

Key patterns:
- **One `setupServer()` per file**, no default handlers -- each test declares exactly what it needs
- **`afterEach(() => server.resetHandlers())`** prevents handler leakage between tests
- **Test error paths too** -- 500s, network failures, malformed responses

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint
