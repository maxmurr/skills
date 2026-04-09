# Structured Output Eval Template

For AI functions that return a typed JSON object.

```typescript
import { evalite } from "evalite";
import { createScorer } from "evalite/scorer";

import { extractTicketInfo } from "./extract-ticket-info";

interface TicketInfo {
  subject: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
}

const fieldMatch = createScorer<string, TicketInfo, TicketInfo>({
  name: "Field Match",
  description: "Checks each field against expected values",
  scorer: ({ output, expected }) => {
    if (!expected) return 0;
    let matches = 0;
    let total = 0;

    if (expected.subject) {
      total++;
      if (output.subject.toLowerCase().includes(expected.subject.toLowerCase())) matches++;
    }
    if (expected.priority) {
      total++;
      if (output.priority === expected.priority) matches++;
    }
    if (expected.category) {
      total++;
      if (output.category === expected.category) matches++;
    }

    return total === 0 ? 1 : matches / total;
  },
});

const fieldCompleteness = createScorer<string, TicketInfo>({
  name: "Field Completeness",
  description: "All required fields are present and non-empty",
  scorer: ({ output }) => {
    const fields = [output.subject, output.priority, output.category];
    const filled = fields.filter((f) => f && String(f).trim().length > 0);
    return filled.length / fields.length;
  },
});

evalite("Extract Ticket Info", {
  data: async () => [
    {
      input: "URGENT: Production database is down, all queries timing out since 3am",
      expected: { subject: "database", priority: "urgent", category: "infrastructure" },
      metadata: { purpose: "happy-path" },
    },
    {
      input: "Can you update the color of the submit button to blue?",
      expected: { subject: "button", priority: "low", category: "ui" },
      metadata: { purpose: "happy-path" },
    },
    {
      input: "",
      expected: { subject: "", priority: "low", category: "general" },
      metadata: { purpose: "boundary-empty" },
    },
    {
      input: "asldkfj asdlfkj random noise text 🎭🎪",
      expected: { subject: "", priority: "low", category: "general" },
      metadata: { purpose: "adversarial" },
    },
  ],
  task: async (input) => {
    return await extractTicketInfo(input);
  },
  scorers: [fieldMatch, fieldCompleteness],
});
```
