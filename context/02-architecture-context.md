# Architecture Context

## Stack

| Layer            | Technology                          | Role                                                                          |
|------------------|-------------------------------------|-------------------------------------------------------------------------------|
| Framework        | React 18 + Vite + TypeScript        | Fast dev build, component model matches v21 prototype directly                |
| Deployment       | Vercel (free tier)                  | todowe.vercel.app — auto-deploys on every GitHub push, no config needed       |
| PWA              | Vite PWA Plugin                     | Installable to home screen, offline support, web push via service worker      |
| Routing          | React Router v6                     | Client-side routing: /login, /tasks, /dashboard                               |
| Styling          | CSS custom properties + inline      | Token-based theming matching the v21 prototype (DARK / LIGHT objects)         |
| Auth             | Supabase Auth                       | Email/password sign-in, JWT sessions, row-level security                      |
| Database         | Supabase (PostgreSQL)               | Tasks, projects, people, reminders, notifications                             |
| Real-time        | Supabase Realtime                   | Live collaboration notifications (assigned, status change) via websocket      |
| AI               | OpenAI API — GPT-4o-mini            | Smart weekly dashboard message — tiny prompt, ~300 tokens per call            |
| Push             | Web Push API + VAPID                | Reminder and smart nudge notifications on Android/desktop; iPhone via PWA     |
| Automation       | n8n (Railway free tier)             | WhatsApp reminders, email digests — optional, not blocking launch             |
| Email            | Resend (free tier)                  | Password reset, invite emails — 3,000/month free                              |
| State            | Zustand                             | Global state: tasks, people, projects, theme, notifications                   |
| Date handling    | date-fns                            | All date formatting, month calculation, time arithmetic                       |

## System Boundaries

- `src/pages/` — Top-level route components: LoginPage, TasksPage, DashboardPage. No business logic.
- `src/components/` — UI composition: TaskCard, DayStrip, ProfileSheet, AddSheet, DetailSheet, NotificationCentre, DashboardView. No direct Supabase calls.
- `src/lib/supabase.ts` — Single Supabase client instance. All DB and auth calls go through here.
- `src/lib/openai.ts` — OpenAI client. Only used for the smart message generation function.
- `src/lib/push.ts` — Web Push registration, VAPID key handling, notification scheduling.
- `src/store/` — Zustand stores: useTaskStore, useNotificationStore, usePeopleStore, useThemeStore.
- `src/hooks/` — Shared logic: useGreeting, useSmartMessage, useProjectColor, useReminderScheduler.
- `src/types/` — TypeScript interfaces: Task, Project, Person, Notification, Reminder.
- `public/sw.js` — Service worker for PWA offline caching and push notification handling.

## Data Model

### Task
```typescript
interface Task {
  id: string;                  // uuid
  owner_id: string;            // references users.id
  project_id: string | null;   // references projects.id
  title: string;
  category: 'Client project' | 'Company task' | 'Personal' | 'Family task';
  status: 'todo' | 'pending' | 'running' | 'completed' | 'rejected';
  progress: number;            // 0–100
  date: string;                // ISO date YYYY-MM-DD
  start_time: string;          // HH:MM
  end_time: string;            // HH:MM
  created_at: string;
}
```

### Project
```typescript
interface Project {
  id: string;
  owner_id: string;
  name: string;
  dark_color: string;          // hex — used in dark mode
  light_color: string;         // hex — used in light mode
  deadline: string | null;
  created_at: string;
}
```

### Person (collaborator)
```typescript
interface Person {
  id: string;
  name: string;
  email: string;
  initials: string;            // auto-generated from name
  color: string;               // auto-generated from email hash
  avatar_url: string | null;   // future: Gmail photo
}
```

### TaskAssignee (join table)
```typescript
// task_assignees: task_id + user_id — composite primary key
```

### TaskReminder
```typescript
interface TaskReminder {
  id: string;
  task_id: string;
  minutes_before: number;      // always stored as minutes regardless of input unit
  fired: boolean;
  created_at: string;
}
// Note: one row per reminder — multiple reminders per task = multiple rows
```

### Notification
```typescript
interface Notification {
  id: string;
  user_id: string;
  task_id: string;
  type: 'assigned' | 'status_change' | 'reminder' | 'nudge_overdue' | 'nudge_stalled';
  title: string;
  body: string;
  read: boolean;
  cleared: boolean;
  created_at: string;
}
```

## Auth and Collaboration Model

- Every task and project has a single owner (Supabase Auth user ID).
- Tasks can have multiple assignees via the task_assignees join table.
- Row-level security: users can only read/write their own records and records they are assigned to.
- Supabase Realtime channels are scoped per user — notifications are delivered only to the target user.
- Session token is stored in Supabase's default local storage mechanism.

## Theme System

- Two theme objects: DARK and LIGHT — defined in `src/theme.ts`, identical to the v21 prototype.
- Module-level `let C = DARK` is swapped by the ThemeProvider before each render.
- All components read from `C` directly — no prop drilling of theme.
- `projColor(proj)` reads `C.isDark` to return the correct dark or light project hex.
- STATUS_DARK and STATUS_LIGHT are separate objects — swapped alongside C.
- CSS custom properties on `:root` are updated when theme changes for any non-component usage.

## Notification Architecture

### Type 1 — Collaboration (real-time)
- Triggered server-side when a task is created with assignees, or a task status is updated.
- Delivered via Supabase Realtime to the target user's channel.
- Stored in the notifications table immediately.

### Type 2 — Reminders (scheduled)
- Created as rows in task_reminders when a task is saved.
- A background scheduler (n8n or a Supabase Edge Function) reads due reminders and sends web push.
- Service worker receives push payload and displays the notification.
- On iPhone: only fires if the app is installed to home screen (PWA requirement).

### Type 3 — Smart Nudges (generated on load)
- Generated client-side when the app loads by scanning task data.
- Overdue: task end_time < now AND status is not completed/rejected.
- Stalled: status is 'running' AND progress < 30.
- Written to the notifications store — not persisted to DB in v1 (added to DB in a later phase).

## AI Integration

- Single call to OpenAI GPT-4o-mini on dashboard load.
- Input: firstName, count of tasks this week, count of completed tasks this week.
- Output: one sentence of natural language, no emojis.
- Three response branches based on completion rate: ≥80%, 50–79%, <50%.
- Prompt lives in `src/lib/openai.ts` — do not call OpenAI from components directly.

## Invariants

1. All Supabase calls happen in store actions or lib functions — never directly inside components.
2. Theme is read from the module-level `C` object — never hardcoded hex values in components.
3. Project colours always go through `projColor(proj)` — never read darkColor or lightColor directly.
4. Task reminders are always stored as minutes_before (integer) — convert hours/days at input time.
5. Clearing a notification (moving to Cleared) is never the same as deleting it — two distinct actions.
6. Tapping a notification must both open the task AND clear the notification in a single operation.
7. The notification centre lives inside the ProfileSheet as a tab — it is not a standalone screen.
