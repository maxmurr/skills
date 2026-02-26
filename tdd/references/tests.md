# Good and Bad Tests

## Test Names

Five rules for naming tests ([source](https://www.epicweb.dev/talks/how-to-write-better-test-names)):

**1. Start with a verb.** Tests verify behaviors. Behaviors are actions, actions are verbs.

```typescript
// ❌
it("homepage");
it("greeting message");

// ✅
it("navigates to the homepage");
it("displays the greeting message");
```

**2. Use subject-less third person.** Imagine "it" before the name — "it fetches the user by id."

```typescript
// ❌
it("fetch the user by id");

// ✅
it("fetches the user by id");
```

**3. Omit implied verbs.** "tests", "should", "must", "checks", "asserts" are noise — they're already implied by being in a test.

```typescript
// ❌
it("tests the homepage");
it("should display the greeting message");

// ✅
it("navigates to the homepage");
it("displays the greeting message");
```

**4. Describe intention, not implementation.** Focus on WHAT the system does, not HOW.

```typescript
// ❌
it("performs a GET request to the /user endpoint");

// ✅
it("fetches the user");
```

**5. Keep it short.** A long name is a smell that the test does too much. Use domain-specific terms to compress.

```typescript
// ❌
it("redirects the user back to the product detail page");

// ✅  (PDP = product detail page)
it("redirects to the PDP");
```

## Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

```typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Characteristics:

- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test
- Uses stable selectors (`data-test` attributes) in UI tests, not CSS classes or DOM structure

## Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

```typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

## Test Error Paths at Boundaries

Boundary tests (adapters, API calls) should cover failures, not just happy paths:

```typescript
it('throws on server error', async () => {
  server.use(
    http.get('http://localhost:3000/riddles', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  await expect(fetchRiddles()).rejects.toThrow('Failed to fetch riddles: 500');
});
```

If your adapter translates HTTP into domain errors, test that translation. A 500 from the server should produce a meaningful error, not a silent `undefined`.

## Test Data

**Inline named constants** for readability:

```typescript
const RIDDLE_A: Riddle = {
  id: '1',
  contents: 'What has hands but cannot clap?',
  answers: [{ id: 'ans_1', text: 'A clock' }],
};
```

**Deferred promises** for controlling async timing in UI tests:

```typescript
const createDeferredAnswer = () => {
  let resolve: (value: Answer) => void;
  const promise = new Promise<Answer>((r) => { resolve = r; });
  return { promise: () => promise, resolve: resolve! };
};
```

This lets you assert on intermediate states (pending, loading) before resolving.

Keep test data close to the test. Shared fixture files become coupling -- if you change a fixture, every test using it might break for the wrong reasons.

## Context Matters: Interaction Tests in Outside-In TDD

The "bad test" above is bad in **classical TDD** -- it couples tests to implementation that might change.

In **outside-in TDD**, interaction tests serve a different purpose: they are **design-time contracts** for collaborators that don't exist yet.

```typescript
// VALID in outside-in: Designing the payment collaborator's interface
test("checkout delegates payment processing to payment service", async () => {
  const mockPayment = mock<PaymentService>();
  mockPayment.process.mockResolvedValue({ status: "ok" });
  const checkout = new CheckoutFlow(mockPayment);

  await checkout.execute(cart);

  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

This is valid **only when**:
- PaymentService doesn't exist yet and you're discovering its interface
- This is an inner-loop test in a double-loop cycle
- An outer acceptance test will verify the real integration
- The mock will be replaced when the real PaymentService is built

Same test is **bad** when:
- PaymentService already exists and works
- No acceptance test covers the real integration
- The mock is permanent
