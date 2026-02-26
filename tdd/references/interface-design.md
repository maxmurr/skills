# Interface Design for Testability

Good interfaces make testing natural:

1. **Accept dependencies, don't create them**

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **Return results, don't produce side effects**

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **Small surface area**
   - Fewer methods = fewer tests needed
   - Fewer params = simpler test setup

4. **Wrap external boundaries in thin adapters**

   Create a thin adapter for every external dependency (HTTP APIs, third-party SDKs). The adapter is the mockable seam; everything behind it is someone else's problem.

   ```typescript
   // Adapter wrapping HTTP -- test with MSW
   export const fetchRiddle = async (id: string): Promise<Riddle> => {
     const response = await fetch(`http://localhost:3000/riddles/${id}`);
     if (!response.ok) throw new Error(`Failed: ${response.status}`);
     return response.json();
   };

   // Adapter wrapping third-party SDK -- test with vi.mock
   import { getAnswerFor } from 'riddle-exam';
   export const fetchCorrectAnswer = async (riddleId: string) => {
     return getAnswerFor(riddleId);
   };
   ```

   Adapters are deliberately shallow -- they translate, they don't decide. This keeps the mock surface tiny and lets you test the real adapter code against a fake network (MSW) or fake module (`vi.mock`).
