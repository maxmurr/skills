---
name: prompt-master
description: Generates effective, well-structured prompts for LLMs using the Anthropic Prompt Template technique. Use when the user wants to create a new LLM prompt, restructure an existing prompt, or improve prompt quality. Do not use for general text writing, non-LLM content generation, prompt debugging, prompt evaluation, or running/testing prompts.
---

# Prompt Master

Generate prompts using the Anthropic Prompt Template technique, which structures content to leverage LLM attention patterns (beginning and end receive highest attention).

## Procedure

### Step 1: Analyze the User's Request

Determine whether the user wants to:

- **Create** a new prompt from scratch.
- **Improve** an existing prompt by restructuring it.

If the request is ambiguous, ask the user to clarify the target use case and desired output format before proceeding.

### Step 2: Identify the Use Case

Match the user's request to one of these use case types to determine required and optional sections:

| Use Case          | Required Sections                                                | Optional Sections |
| ----------------- | ---------------------------------------------------------------- | ----------------- |
| Simple Q&A        | Task Context, The Ask                                            | Output Formatting |
| Chatbot           | Task Context, Tone, Rules, History, The Ask                      | Examples          |
| Data Extraction   | Task Context, Rules, Examples, The Ask, Output Formatting        | Background Data   |
| Document Analysis | Task Context, Background Data, Rules, The Ask, Output Formatting | Examples          |
| Complex Agent     | All sections                                                     | -                 |

If the request does not fit any use case, default to **Complex Agent** (all sections) and omit sections that are clearly irrelevant.

### Step 3: Read the Template

Read `assets/prompt-template.ts` and use its structure as the base for the new prompt. Copy the section ordering exactly — do not rearrange sections.

### Step 4: Construct Each Section

Build the prompt by filling in each required section in this exact order:

1. **Task Context** (beginning) — Define the role and primary objective. Place this first; LLMs give highest attention here.
2. **Tone Context** (optional) — Set the communication style. Include only if the use case requires it.
3. **Background Data** (middle) — Wrap reference documents in XML tags. See `references/xml-tags.md` for tag conventions.
4. **Rules** — Write explicit instructions and edge case handling as a bullet list.
5. **Examples** (few-shot) — Provide 1-3 input/output examples. Do not exceed 3.
6. **Conversation History** (if multi-turn) — Include only for chatbot or agent use cases.
7. **The Ask** (end) — Place the actual user request near the end. LLMs give highest attention here.
8. **Thinking Instructions** (end) — Add chain-of-thought trigger after The Ask.
9. **Output Formatting** (end) — Specify the desired output structure last.

For detailed descriptions and templates for each section, read `references/section-details.md`.

### Step 5: Apply Quality Checks

Verify the constructed prompt against these rules:

- **Critical content placement:** Task Context is at the beginning. The Ask, Thinking Instructions, and Output Formatting are at the end. Confirm no critical instructions are buried in the middle.
- **XML tag consistency:** Each content type uses exactly one tag name throughout. Tags are not nested more than one level deep. See `references/xml-tags.md` for conventions.
- **Example count:** No more than 3 few-shot examples are included.
- **Edge case coverage:** Rules section addresses at least one edge case (e.g., missing input, ambiguous request, out-of-scope question).
- **Output format specified:** The prompt ends with an explicit output format instruction.

If any check fails, fix the prompt before presenting it to the user.

### Step 6: Present the Prompt

Return the final prompt to the user. If the user requested an improvement to an existing prompt, highlight what changed and why.

## Error Handling

- **Ambiguous use case:** If the user's request does not clearly map to a use case type, ask: "What is the primary task this prompt should accomplish?" Do not guess.
- **Missing context:** If the user wants Background Data or Examples but has not provided source material, ask for it before constructing those sections.
- **Multi-turn vs. single-shot unclear:** If the prompt could be either, ask: "Will this prompt be used in a single exchange or a multi-turn conversation?" This determines whether to include History and Conversation History sections.
- **Existing prompt is unstructured:** When improving an existing prompt, first identify which sections are present (even if unlabeled), then restructure into the correct order. Do not discard content — relocate it to the appropriate section.
