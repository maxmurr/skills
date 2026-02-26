# XML Tag Conventions

Use XML tags to create clear boundaries between prompt sections. Select tags from the lists below based on content type.

## Document Separation

- `<document>` - general reference material
- `<guide>` - instructional content
- `<context>` - background information

## Examples

- `<example>` - input/output demonstration pairs

## Instructions

- `<rules>` - behavioral constraints and guidelines

## Conversation History

- `<history>` - prior messages in multi-turn contexts

## User Input

- `<request>` - the primary user ask
- `<question>` - user query in Q&A contexts

## Output Wrapping

- `<response>` - general output wrapper
- `<output>` - structured data output wrapper

## Guidelines

- Pick one tag per content type and use it consistently throughout the prompt.
- Do not nest XML tags more than one level deep.
- Do not wrap every sentence in tags — use them only at section boundaries.
