# Prompt Section Details

Detailed descriptions and templates for each section of the Anthropic Prompt Template.

## 1. Task Context (Beginning - High Priority)

Place at the very beginning. LLMs give highest attention to the start of a prompt.
Define the role and primary objective.

```
You will be acting as [ROLE] created by [COMPANY/CONTEXT]. Your goal is to [PRIMARY OBJECTIVE].
```

## 2. Tone Context (Optional)

Place immediately after Task Context. Set the communication style.

```
You should maintain a [TONE] tone.
```

## 3. Background Data (Middle)

Wrap reference documents in XML tags. This section tolerates the middle position because LLMs parse structured XML reliably regardless of position.

```
Here is the [DOCUMENT TYPE] you should reference:
<document>
[CONTENT]
</document>
```

## 4. Rules

Explicit instructions and edge case handling. Use bullet lists for clarity.

```
Important rules:
- [INSTRUCTION 1]
- [INSTRUCTION 2]
- [EDGE CASE HANDLING]
```

## 5. Examples (Few-Shot)

Provide 1-3 examples demonstrating expected input/output behavior. More than 3 examples yields diminishing returns.

```
<example>
User: [INPUT]
Assistant: [OUTPUT]
</example>
```

## 6. Conversation History (If Applicable)

Include only for multi-turn use cases (chatbots, agents with memory).

```
<history>
[PREVIOUS MESSAGES]
</history>
```

## 7. The Ask (End - Critical)

Place near the end. This is the actual user request. LLMs give highest attention to the end of a prompt.

```
<request>
[USER INPUT]
</request>
[SPECIFIC INSTRUCTION]
```

## 8. Thinking Instructions (End - Critical)

Trigger chain-of-thought reasoning. Place after The Ask.

```
Think step by step before responding.
```

## 9. Output Formatting (End - Critical)

Specify the desired output structure. Place last.

```
Format your response as [FORMAT].
Put your response in <response></response> tags.
```
