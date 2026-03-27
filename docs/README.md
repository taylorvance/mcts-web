# Docs

This directory is for durable project documentation that should outlive a single PR.

Use `TODO.md` at the repo root for lightweight current reminders until the repo settles on a stronger tracking convention.

Current organization:

- `plans/`: speculative or parked implementation plans that are not active work

Suggested long-term organization:

- `plans/`: scoped future work, open design questions, and deferred ideas
- `architecture/`: current-state system design and data-flow docs
- `benchmarks/`: methodology notes, profiling guidance, and interpretation docs

When adding a new plan, prefer one file per topic with:

- a short status line
- explicit scope and non-goals
- implementation phases
- major risks or open questions
