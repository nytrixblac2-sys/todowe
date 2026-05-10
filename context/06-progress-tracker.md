# Progress Tracker

Update this file at the end of every session. It is the handoff document between sessions — read it first before writing any code.

## Current Phase

- Phase 1 — Foundation — **IN PROGRESS**

## Current Goal

- Create Supabase database tables and deploy to Vercel so todowe.vercel.app is live with the login screen.

## Completed

- [x] Create Vite + React + TypeScript project (manual scaffold, not create-vite — directory was non-empty)
- [x] Install dependencies: react-router-dom, zustand, @supabase/supabase-js, date-fns, openai, vite-plugin-pwa
- [x] Set up `src/theme.ts` — DARK, LIGHT, STATUS_DARK, STATUS_LIGHT, projColor, REMINDER_OPTIONS, CAT_ICON, swapTheme() from v21 prototype
- [x] Set up `src/types/index.ts` — Task, Project, Person, Notification, TaskReminder, AuthUser interfaces + union types
- [x] Set up `src/lib/supabase.ts` — single Supabase client from env vars
- [x] Set up `src/store/useThemeStore.ts` — Zustand theme store with toggle and swapTheme wiring
- [x] Set up `src/store/useAuthStore.ts` — Zustand auth store with signIn, signOut, init, session persistence via onAuthStateChange
- [x] Build `src/pages/LoginPage.tsx` — matches v21 exactly (logo, email/password form, theme toggle)
- [x] Build `src/pages/TasksPage.tsx` — placeholder, Phase 2
- [x] Build `src/pages/DashboardPage.tsx` — placeholder, Phase 3
- [x] Build `src/App.tsx` — React Router v6, protected routes, swapTheme on every render
- [x] Build `src/main.tsx` — global CSS (fonts, reset, animations, scrollbar hide)
- [x] Configure PWA — vite-plugin-pwa, manifest with icons, service worker (generateSW mode)
- [x] Production build passes: `npx vite build` — 84 modules, dist/sw.js generated
- [x] TypeScript passes: `npx tsc --noEmit` — zero errors

## In Progress

- [ ] Create Supabase database tables (SQL ready — user needs to run in Supabase SQL editor)
- [ ] Enable row-level security on all tables
- [ ] Deploy to Vercel — confirm todowe.vercel.app is live
- [ ] Set up GitHub → Vercel auto-deploy pipeline

## Next Up (in order)

### Remaining Phase 1
- [ ] User runs Supabase SQL (provided below in Session Notes)
- [ ] User creates GitHub repo and pushes code
- [ ] User connects Vercel to GitHub repo, sets VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars
- [ ] Confirm login screen is live at todowe.vercel.app

### Phase 2 — Calendar & Tasks
- [ ] Build DayStrip component — horizontal scroll, month nav, dot indicators, scroll-to-selected
- [ ] Build TasksPage layout — header with greeting, day strip, timeline, FAB
- [ ] Build useGreeting hook — Good morning / Good afternoon / Good evening
- [ ] Build useTaskStore — fetch tasks by date, create, update, delete
- [ ] Build TaskCard component — notched layout, status badge, avatar row, diamond icon, kebab menu
- [ ] Build AddSheet — full form: title, category, status, times, project, people, reminders
- [ ] Build DetailSheet (Edit) — same as AddSheet pre-filled with existing task data
- [ ] Build CustomReminderInput component — number input + unit selector (min/hrs/days), converts to minutes
- [ ] Wire multi-reminder picker — preset pills (toggle on/off) + CustomReminderInput
- [ ] Build usePeopleStore — fetch collaborators, add by email, generate initials and colour from email

### Phase 3 — Projects & Dashboard
- [ ] Build useProjectStore — fetch projects, create inline, projColor helper
- [ ] Wire project selector in AddSheet and DetailSheet
- [ ] Build DashboardPage layout
- [ ] Build smart message — call OpenAI GPT-4o-mini with completion rate, cache in store
- [ ] Build status grid — 2×2 count cards for all 5 statuses
- [ ] Build completion breakdown — progress bars per status
- [ ] Build project tracker — progress bar, done/total, percentage per project
- [ ] Build Up Next list — upcoming incomplete tasks across all days

### Phase 4 — Notifications
- [ ] Build useNotificationStore — notifications state, clear, delete, clearAll, deleteAll
- [ ] Seed Type 3 smart nudges on app load — scan tasks for overdue and stalled
- [ ] Build ProfileSheet — Account tab and Notifications tab
- [ ] Build notification rows — icon, type label, title, body, time-ago, unread dot, clear button
- [ ] Wire notification badge on avatar — red dot with unread count
- [ ] Wire tap-notification-opens-task — clear notification AND open DetailSheet in single action
- [ ] Wire Type 1 collaboration notifications — Supabase Realtime channel per user
- [ ] Set up VAPID keys for Web Push
- [ ] Build push.ts — register service worker, subscribe to push, send subscription to Supabase
- [ ] Build service worker push handler — display notification on push event
- [ ] Wire Type 2 reminders — on task save, write rows to task_reminders, schedule push via Edge Function
- [ ] Test iPhone PWA install prompt flow

### Phase 5 — Polish
- [ ] Dark/light theme transition — smooth CSS transition on all surfaces
- [ ] Theme toggle on login screen
- [ ] "Add to Home Screen" prompt for iPhone users
- [ ] Offline caching via service worker
- [ ] Error states — failed Supabase calls, failed OpenAI calls, no-network state
- [ ] Empty states — no tasks today, no projects, no notifications
- [ ] Loading states — skeleton UI while tasks fetch

## Open Questions

- Should task_reminders be processed by an n8n workflow on Railway or a Supabase Edge Function? Edge Function is simpler and free — decide before Phase 4.
- Should Type 3 smart nudges be stored in the notifications DB table or only in Zustand memory? Start in memory (v1), add DB persistence in a later phase.
- When a user adds a collaborator by email, do we create a Supabase auth user for them immediately, or just store a pending record? Decision needed before Phase 4.

## Architecture Decisions

- Web-first PWA on Vercel — no React Native, no Expo, no App Store until proven.
- OpenAI GPT-4o-mini for smart message — using existing API key, no additional cost.
- todowe.vercel.app as the URL — domain deferred until public launch.
- All reminder data stored as minutes_before integers — conversion happens at input time in CustomReminderInput.
- Notification centre lives inside ProfileSheet as a tab — not a separate route or standalone modal.
- projColor(proj) is the single access point for project colours — enforced by code standards.
- Manual scaffold used instead of create-vite — context folder in root prevented interactive prompt.
- swapTheme() is called from App.tsx on every render to keep module-level C and STATUS refs current.
- Theme store (useThemeStore) is the single source of truth for isDark — LoginPage reads from store, not local state.

## Session Notes

- Design reference: todowe-v21.jsx — this is the canonical prototype. Match it exactly.
- The prototype uses module-level `let C = DARK` swapped before render — replicated via swapTheme() in src/theme.ts.
- All six context files should be uploaded to VS Code at the start of every Claude Code session.
- Push to GitHub after every verified feature — Vercel auto-deploys.
- Cost constraint: everything must stay within free tiers. Check before adding any new service.

### Supabase SQL — run this in the Supabase SQL editor before Phase 2

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects
create table projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  dark_color text not null default '#c8f56a',
  light_color text not null default '#2d7a0f',
  deadline date,
  created_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  category text not null check (category in ('Client project','Company task','Personal','Family task')),
  status text not null default 'pending' check (status in ('todo','pending','running','completed','rejected')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

-- Task assignees (join table)
create table task_assignees (
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  primary key (task_id, user_id)
);

-- Task reminders
create table task_reminders (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade not null,
  minutes_before integer not null,
  fired boolean not null default false,
  created_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete set null,
  type text not null check (type in ('assigned','status_change','reminder','nudge_overdue','nudge_stalled')),
  title text not null,
  body text not null,
  read boolean not null default false,
  cleared boolean not null default false,
  created_at timestamptz default now()
);

-- Row-level security
alter table projects       enable row level security;
alter table tasks          enable row level security;
alter table task_assignees enable row level security;
alter table task_reminders enable row level security;
alter table notifications  enable row level security;

-- RLS policies: projects
create policy "users manage own projects"
  on projects for all using (auth.uid() = owner_id);

-- RLS policies: tasks
create policy "users manage own tasks"
  on tasks for all using (auth.uid() = owner_id);

create policy "assignees can read tasks"
  on tasks for select
  using (exists (
    select 1 from task_assignees
    where task_assignees.task_id = tasks.id
      and task_assignees.user_id = auth.uid()
  ));

-- RLS policies: task_assignees
create policy "task owners manage assignees"
  on task_assignees for all
  using (exists (
    select 1 from tasks
    where tasks.id = task_assignees.task_id
      and tasks.owner_id = auth.uid()
  ));

create policy "assignees can read own assignments"
  on task_assignees for select
  using (auth.uid() = user_id);

-- RLS policies: task_reminders
create policy "task owners manage reminders"
  on task_reminders for all
  using (exists (
    select 1 from tasks
    where tasks.id = task_reminders.task_id
      and tasks.owner_id = auth.uid()
  ));

-- RLS policies: notifications
create policy "users manage own notifications"
  on notifications for all using (auth.uid() = user_id);
```
