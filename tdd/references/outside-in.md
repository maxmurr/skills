# Outside-In TDD

Also called London-school, mockist, or double-loop TDD.

## When to Use

See decision table in [SKILL.md](../SKILL.md#choosing-your-approach). Short version: use when you need to **discover interfaces between collaborators** by driving from the outermost behavior inward.

## Philosophy

Start from what the user wants. Write a failing acceptance test. Then drill inward, using mocks to define the contracts between layers you haven't built yet. Each inner layer gets its own TDD cycle. Mocks are **design tools** here, not test shortcuts -- they express the interface you wish existed.

The acceptance test stays red until all inner layers are real. That's the double loop.

## The Double Loop

```
         ┌─────────────────────────────────────┐
         │         INNER LOOP (unit)            │
         │                                      │
         │    Write failing ──→ Make the        │
         │     unit test        test pass       │
         │         ↑               │            │
         │         └── Refactor ←──┘            │
         │                                      │
  Write failing                                 │
  acceptance test ──────────────────────────────┘
         ↑                         │
         │      OUTER LOOP         │
         └─────────────────────────┘
              (acceptance)

  Outer loop: stays RED until all layers are real
  Inner loop: RED → GREEN → REFACTOR per collaborator
```

### Rules

- Acceptance test uses real implementations end-to-end (no mocks)
- Inner unit tests mock **only the next layer down** (direct collaborators)
- Each mock represents a **design decision** about an interface
- When the inner collaborator is implemented, the mock becomes unnecessary -- the acceptance test covers it
- Replace mocks with real implementations as you move inward
- Never leave mocks as permanent fixtures if the real thing is available

## Workflow

### 1. Planning

Using the entry point and scope identified in [Task Analysis](../SKILL.md#task-analysis), plus:

- [ ] Identify the layers/boundaries you expect to discover
- [ ] Start from the outermost user-facing behavior
- [ ] Sketch (don't finalize) likely collaborator interfaces

### 2. Acceptance Test (Outer Loop)

Write ONE acceptance test that describes the full user-facing behavior. This test:

- Uses real implementations (no mocks)
- Will stay red until all inner layers exist
- Acts as your north star

```
RED: Write acceptance test → fails (missing collaborators)
```

### 3. Drill Inward (Inner Loop)

For each collaborator the acceptance test needs:

```
RED:   Write unit test mocking the next-layer collaborator → fails
GREEN: Implement just enough → passes
REFACTOR
```

Then go one layer deeper. Repeat until you hit:
- Pure logic (no collaborators to mock)
- System boundaries (use boundary mocks per [mocking.md](mocking.md))

### 4. Integration

As inner layers become real, the acceptance test should start passing without changes. If it doesn't, your mocks diverged from reality -- fix the contract.

### 5. Cleanup

- [ ] Remove any remaining unnecessary mocks
- [ ] Verify acceptance test passes with all real implementations
- [ ] Refactor per [refactoring.md](refactoring.md)

## Checklist Per Cycle

```
[ ] Acceptance test uses no mocks
[ ] Inner mocks represent design decisions about interfaces
[ ] Each mock is for a direct collaborator only (not transitive)
[ ] Mocks are replaced as real implementations arrive
[ ] No permanent mocks for things you control
```

## Anti-Patterns

- **Mock everything**: Mocking transitive dependencies, not just direct collaborators. Test becomes a wiring diagram.
- **Permanent mocks**: Leaving mocks in place after real implementation exists. Tests pass but prove nothing.
- **Mock-driven design rigidity**: Letting mock structure prevent refactoring. If you can't change collaborator boundaries, your mocks own you.
- **Skipping the acceptance test**: Writing only unit tests with mocks. You get isolated pieces that might not integrate.
