// Complete prompt template demonstrating the Anthropic Prompt Template technique.
// Copy this structure and adapt each section to the target use case.

const prompt = (opts: {
  documents: string;
  history: string;
  question: string;
}) => `
You will be acting as a helpful assistant specializing in [DOMAIN]. Your goal is to [OBJECTIVE].

You should maintain a professional yet approachable tone.

Reference material:
<documents>
${opts.documents}
</documents>

Rules:
- Cite sources when referencing documents
- State clearly if information is not available
- Ask for clarification if question is unclear

<example>
User: What is X?
Assistant: Based on the documents, X is [definition]. Source: [reference].
</example>

<history>
${opts.history}
</history>

<question>
${opts.question}
</question>

Provide a clear response. Think through your answer first.
`;
