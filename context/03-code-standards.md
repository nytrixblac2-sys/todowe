# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds over broken behaviour.
- Do not mix unrelated concerns in one component or store action.
- Respect the system boundaries defined in `02-architecture-context.md`.
- The v21 prototype (todowe-v21.jsx) is the canonical design reference — match it exactly before adding anything new.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any` — use explicit interfaces defined in `src/types/`.
- Validate external input (Supabase responses, OpenAI output, push payloads) at system boundaries.
- Use `interface` for object contracts. Use `type` for unions and aliases.
- All task statuses, categories, and notification types must use the union types defined in `src/types/` — no raw strings.

## React

- Functional components only. No class components.
- Keep components focused on rendering — push logic into hooks or store actions.
- Use `useMemo` for derived data that recalculates on every render (e.g. byHour grouping of tasks).
- Use `useRef` for DOM manipulation (e.g. DayStrip scroll-to-selected behaviour).
- Do not call Supabase, OpenAI, or any external service directly inside a component — go through `src/lib/` or `src/store/`.

## Theming

- Never hardcode hex values in components. Always read from `C` (the module-level theme object).
- Never read `proj.darkColor` or `proj.lightColor` directly — always call `projColor(proj)`.
- Never read `STATUS_DARK` or `STATUS_LIGHT` directly — always read from `STATUS` (the module-level ref).
- When adding a new coloured element, check whether it needs both a dark and light value. If yes, add it to both DARK and LIGHT in `src/theme.ts`.
- CSS custom properties on `:root` are updated by ThemeProvider when theme switches — use them for any non-component CSS (e.g. scrollbar, selection colour).

## Styling

- The design system is defined in `src/theme.ts` as DARK and LIGHT token objects.
- Component spacing, border-radius, font sizes, and font weights must match the v21 prototype exactly.
- Border radius scale:
  - Small elements (badges, pills): `borderRadius: 20` (fully rounded)
  - Inputs, selects, small cards: `borderRadius: 12–14`
  - Task cards, sheet bodies: `borderRadius: 18–20`
  - Bottom sheets: `borderRadius: "28px 28px 0 0"`
- Fonts: Space Grotesk (weight 700/800) for all headings and titles. DM Mono (weight 400/500) for all labels, metadata, times, and monospace text. Both loaded from Google Fonts.
- Animations: fadeUp for task cards on mount, slideUp for bottom sheets. Defined as CSS keyframes.

## Notifications

- Notification type must always be one of the five defined types: `assigned`, `status_change`, `reminder`, `nudge_overdue`, `nudge_stalled`.
- Clearing a notification sets `cleared: true` — it never deletes the row (that is a separate Delete action in the Cleared tab).
- Tapping a notification must always do two things atomically: open the task AND set cleared to true. Never one without the other.
- If a notification's task no longer exists, show the "Task no longer exists" modal — do not throw an error.
- Multiple reminders on one task = multiple rows in task_reminders. Never store reminders as an array column.
- Custom reminder input always converts to minutes before storing: hours × 60, days × 1440.

## Task Cards

- The notched card layout is the signature UI element — do not simplify it.
- Status badge sits above the card body with `marginBottom: -14` to create the overlap.
- Avatars in the notch overlap with `marginLeft: -9` per avatar after the first.
- The kebab menu (⋮) opens a dropdown with Edit and Delete — tapping outside closes it.
- The card body (title + icon) and the notch row (badge + avatars) have separate onClick handlers.
- Diamond icon is the category icon rotated 45deg with the text counter-rotated 45deg.

## Supabase

- All Supabase calls go through `src/lib/supabase.ts` — import the client from there.
- Always handle Supabase errors explicitly — check `error` before using `data`.
- Row-level security is the source of truth for access control — do not replicate it in client code.
- Real-time subscriptions must be unsubscribed when the component or store unmounts.

## OpenAI

- All OpenAI calls go through `src/lib/openai.ts`.
- Model: `gpt-4o-mini` — do not change this.
- Max tokens: 150 for the smart message — it should be one sentence.
- No emojis in the prompt output — enforce this in the system prompt.
- Cache the weekly message in Zustand — do not re-call on every dashboard render.

## File Organisation

- `src/pages/` — route-level components only.
- `src/components/` — UI components matching the v21 prototype structure.
- `src/store/` — Zustand stores. One file per domain: tasks, notifications, people, theme.
- `src/lib/` — external service clients: supabase.ts, openai.ts, push.ts.
- `src/hooks/` — reusable logic: useGreeting.ts, useSmartMessage.ts, useProjectColor.ts.
- `src/types/` — all TypeScript interfaces and union types.
- `src/theme.ts` — DARK, LIGHT, STATUS_DARK, STATUS_LIGHT, projColor, REMINDER_OPTIONS.
- Name files after the responsibility they contain, not the technology.
