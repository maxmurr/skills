# Minimal Eval Template

Simplest starting point. Exact match scorer + one quality check.

```typescript
import { evalite } from "evalite";
import { createScorer } from "evalite/scorer";
import { exactMatch } from "evalite/scorers";

import { myFunction } from "./my-function";

const outputNotEmpty = createScorer<string, string>({
  name: "Output Not Empty",
  description: "Checks that output is non-empty",
  scorer: ({ output }) => (output.trim().length > 0 ? 1 : 0),
});

evalite("My Function Eval", {
  data: async () => [
    { input: "hello", expected: "Hello!" },
    { input: "world", expected: "World!" },
  ],
  task: async (input) => {
    return await myFunction(input);
  },
  scorers: [exactMatch, outputNotEmpty],
});
```
