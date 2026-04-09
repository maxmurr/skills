# Retrieval / RAG Eval Template

For AI functions that retrieve documents or generate answers grounded in context.

```typescript
import { evalite } from "evalite";
import { createScorer } from "evalite/scorer";
import { faithfulness, contextRecall } from "evalite/scorers";

import { retrieveAndAnswer } from "./retrieve-and-answer";

interface RetrievalInput {
  query: string;
  context: string[];
}

interface RetrievalOutput {
  answer: string;
  sources: string[];
}

const sourcesReturned = createScorer<RetrievalInput, RetrievalOutput>({
  name: "Sources Returned",
  description: "At least one source is cited in the response",
  scorer: ({ output }) => (output.sources.length > 0 ? 1 : 0),
});

const answerGrounded = createScorer<RetrievalInput, RetrievalOutput, string>({
  name: "Answer Grounded",
  description: "Answer text references content from provided context",
  scorer: ({ output, input }) => {
    const answerLower = output.answer.toLowerCase();
    const grounded = input.context.some((chunk) =>
      chunk
        .toLowerCase()
        .split(" ")
        .some((word) => word.length > 4 && answerLower.includes(word)),
    );
    return grounded ? 1 : 0;
  },
});

evalite("RAG Pipeline", {
  data: async () => [
    // Happy path — answer clearly in context
    {
      input: {
        query: "What is the refund policy?",
        context: ["Refunds are available within 30 days of purchase.", "Contact support for help."],
      },
      expected: "Refunds are available within 30 days of purchase.",
      metadata: { purpose: "happy-path" },
    },

    // Boundary — answer requires synthesis across chunks
    {
      input: {
        query: "How do I get a refund and contact support?",
        context: ["Refunds are available within 30 days.", "Email support@example.com for assistance."],
      },
      expected: "Refunds within 30 days. Contact support@example.com.",
      metadata: { purpose: "boundary-synthesis" },
    },

    // Negative — no relevant context
    {
      input: {
        query: "What is the weather today?",
        context: ["Our product ships worldwide.", "Free returns within 14 days."],
      },
      expected: "",
      metadata: { purpose: "negative-no-context" },
    },
  ],
  task: async (input) => {
    return await retrieveAndAnswer(input.query, input.context);
  },
  scorers: [faithfulness, sourcesReturned, answerGrounded],
});
```
