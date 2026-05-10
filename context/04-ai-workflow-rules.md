# Development Workflow

## Approach

Build Todowe incrementally using these six context files as the single source of truth. The v21 prototype (todowe-v21.jsx) is the canonical design reference — every UI decision traces back to it. Always implement against the specs here. Do not infer or invent behaviour that is not defined in these files.

## The Prototype is the Reference

Before writing any component, open todowe-v21.jsx and find the equivalent section. Match:
- Exact spacing values (padding, gap, marginBottom)
- Exact border radius values
- Exact font sizes and weights
- Exact colour token usage (always via C.*, never hardcoded)
- Exact animation names (fadeUp, slideUp)

If the prototype and the spec conflict, the prototype wins for UI. The spec wins for data model and architecture.

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine UI changes and database changes in the same implementation step.
- Do not combine multiple unrelated components in one step.

## Build Order

Follow the phases in `06-progress-tracker.md`. Do not skip ahead. Each phase depends on the previous being fully working.

**Phase 1** must be complete before Phase 2 begins:
- Vite + React + TypeScript scaffold
- Supabase connected (auth working, DB tables created)
- Vercel deployed — todowe.vercel.app is live
- Login screen working end to end

**Do not start notifications before projects work.**
**Do not start the dashboard before tasks and projects work.**

## Decision Protocol

When you encounter a decision point:

1. Check `02-architecture-context.md` for the relevant invariant or boundary rule.
2. Check `03-code-standards.md` for the relevant convention.
3. Check `05-ui-context.md` for the relevant design token or layout rule.
4. If none of these resolves it, check the v21 prototype for the exact implementation.
5. If still unresolved, add it as an open question in `06-progress-tracker.md` and surface it before proceeding.
6. Never make a silent architectural decision — log it in `06-progress-tracker.md` under Architecture Decisions.

## When To Split Work

Split an implementation step if it:
- Combines UI changes and Supabase schema changes
- Combines two unrelated components (e.g. DayStrip and NotificationCentre)
- Touches more than one Zustand store
- Cannot be verified end to end in under 5 minutes

If a change cannot be verified quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behaviour not defined in the context files.
- If a requirement is ambiguous, check the prototype first, then resolve in the relevant context file.
- If a requirement is genuinely missing, add it as an open question in `06-progress-tracker.md`.

## Protected Patterns — Do Not Change Without Explicit Instruction

These are load-bearing design decisions. Do not modify them:

- The notched card layout (status badge + avatars overlapping the card top edge via `marginBottom: -14`)
- The module-level `let C = DARK` theme swap pattern — do not convert to React context prop drilling
- The `projColor(proj)` function — always the access point for project colours
- The `STATUS` module-level ref — always the access point for status colours
- Notifications live inside ProfileSheet as a tab — not a standalone page or modal
- Clearing a notification ≠ deleting it — two distinct operations always

## Verification Standard

After each implementation unit:

- The feature must be testable end to end in the browser.
- Any new Supabase table must have at least one successful read and write verified.
- Any new component must render without errors in both dark and light mode.
- Any new notification type must appear in the ProfileSheet notification inbox.
- Push to GitHub after each verified unit — Vercel deploys automatically.
- If it cannot be verified, the step is too large — split it.

## Cost Constraint

Every dependency and service decision must remain within the free tier. Before adding any new service or library:
- Confirm it has a free tier that covers the expected usage.
- Document it in `02-architecture-context.md` under Stack.
- If it costs money, find the free alternative first. Ask before proceeding.
