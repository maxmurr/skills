# Component Testing

Mount real component trees. Fake only the boundaries.

## The Idea

Component tests sit between unit tests and full E2E. They mount your actual components with real DOM, real routing, and real state management. The only fakes are at system boundaries (HTTP, third-party SDKs).

Any tool that can mount components works: Cypress component testing, Playwright component testing, Testing Library + jsdom, Storybook interaction tests, etc. The patterns below are framework-agnostic.

## Custom Mount Helper

Wrap your test framework's mount to inject test-friendly infrastructure (memory/hash router, providers, wrappers):

```typescript
function mountApp(element: ReactElement, path: string) {
  // Inject test router, set initial path, wrap in StrictMode
  return mount(
    <StrictMode>{injectTestRouter(element, path)}</StrictMode>
  );
}
```

This keeps individual tests clean -- they declare intent, not plumbing.

## Stable Selectors

Use `data-test` attributes for refactor-proof selectors:

```typescript
// Component
<button data-test={`answer-${answer.id}`}>...</button>

// Test -- works in any framework
getByTestId('answer-2').click();
```

CSS classes change with design. Text changes with copy. DOM structure changes with refactors. `data-test` attributes survive all three.

## Faking Boundaries

### HTTP

Intercept network requests so the real adapter code runs but never hits a real server:

```typescript
// Cypress
cy.intercept('GET', '/riddles/1', { body: RIDDLE });

// MSW (works with Testing Library, Playwright, etc.)
server.use(
  http.get('/riddles/1', () => HttpResponse.json(RIDDLE)),
);
```

### Services: Context/Provider Injection

Swap real implementations via dependency injection through context (or props, or a service locator -- whatever the app uses):

```typescript
// Production: real SDK
<ContextProvider providers={[provideRiddleAnswer(fetchCorrectAnswer)]}>
  <App />
</ContextProvider>

// Test: fake that returns instantly
const fakeAnswer = () => Promise.resolve({ id: '2', text: 'Correct' });
mountApp(
  <ContextProvider providers={[provideRiddleAnswer(fakeAnswer)]}>
    <App />
  </ContextProvider>,
  '/riddle/1',
);
```

The component doesn't know or care whether it got a real or fake provider. That's the point.

### Router: Prop/Factory Injection

Accept the router factory as a prop so tests can inject a test-friendly router (hash, memory):

```typescript
// App.tsx -- defaults to browser router in production
export const App: FC<Props> = ({ createRouter = createBrowserRouter }) => {
  return <RouterProvider router={createRouter(routes)} />;
};

// Test -- injects memory or hash router
mountApp(<App createRouter={createMemoryRouter} />, '/riddle/1');
```

## Testing Async State Transitions

Use deferred promises to freeze time at intermediate states:

```typescript
const createDeferred = <T,>() => {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise: () => promise, resolve: resolve! };
};

it('shows pending state then resolves to correct', async () => {
  const deferred = createDeferred<Answer>();

  mountApp(
    <ContextProvider providers={[provideRiddleAnswer(deferred.promise)]}>
      <App />
    </ContextProvider>,
    '/riddle/1',
  );

  // Click triggers the async call -- promise hasn't resolved yet
  click('answer-2');
  assertAttribute('answer-2', 'data-status', 'pending');

  // Now release the promise
  deferred.resolve({ id: '2', text: 'An obstacle/tower' });

  assertAttribute('answer-2', 'data-status', 'correct');
});
```

This tests the full state machine: idle → pending → resolved. Without deferred promises you can only test the final state.

## What Makes a Good Component Test

- Mounts the real component tree (not shallow renders)
- Fakes only system boundaries (HTTP, external SDKs)
- Interacts the way a user would (click, type, navigate)
- Asserts on what the user sees (text, attributes, visibility)
- Tests state transitions, not just final states
