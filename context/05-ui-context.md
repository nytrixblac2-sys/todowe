# UI Context

## Theme System

Todowe supports two complete themes: Dark and Light. Both are defined in `src/theme.ts` as token objects. The module-level variable `let C = DARK` is swapped before each render by the ThemeProvider. Components always read from `C` — never hardcoded hex values.

### Dark Theme Tokens (`DARK`)

| Role              | Token Key    | Hex Value   |
|-------------------|--------------|-------------|
| Page background   | `C.bg`       | `#0f1629`   |
| Surface           | `C.surface`  | `#16213e`   |
| Card              | `C.card`     | `#1a2744`   |
| Accent (lime)     | `C.accent`   | `#c8f56a`   |
| Cyan              | `C.cyan`     | `#5ce1e6`   |
| Purple            | `C.purple`   | `#c4b5fd`   |
| Amber             | `C.amber`    | `#f59e0b`   |
| Muted             | `C.muted`    | `#6b7a99`   |
| Primary text      | `C.text`     | `#e8eaf6`   |
| Dim text          | `C.dim`      | `#8892b0`   |
| isDark flag       | `C.isDark`   | `true`      |

### Light Theme Tokens (`LIGHT`)

| Role              | Token Key    | Hex Value   |
|-------------------|--------------|-------------|
| Page background   | `C.bg`       | `#f0f3fa`   |
| Surface           | `C.surface`  | `#ffffff`   |
| Card              | `C.card`     | `#e8edf7`   |
| Accent (green)    | `C.accent`   | `#2d7a0f`   |
| Cyan              | `C.cyan`     | `#0891b2`   |
| Purple            | `C.purple`   | `#7c3aed`   |
| Amber             | `C.amber`    | `#d97706`   |
| Muted             | `C.muted`    | `#94a3b8`   |
| Primary text      | `C.text`     | `#1a2340`   |
| Dim text          | `C.dim`      | `#4a5a7a`   |
| isDark flag       | `C.isDark`   | `false`     |

### Task Status Colours

Two STATUS objects — STATUS_DARK and STATUS_LIGHT — swapped alongside C. Always read from `STATUS` (the module-level ref), never from STATUS_DARK or STATUS_LIGHT directly.

| Status    | Dark colour  | Light colour | Badge fg (both) |
|-----------|--------------|--------------|-----------------|
| todo      | `#94a3b8`    | `#64748b`    | `#0f1629` / `#fff` |
| completed | `#c8f56a`    | `#2d7a0f`    | `#0f1629` / `#fff` |
| running   | `#c4b5fd`    | `#7c3aed`    | `#0f1629` / `#fff` |
| pending   | `#f59e0b`    | `#d97706`    | `#0f1629` / `#fff` |
| rejected  | `#5ce1e6`    | `#0891b2`    | `#0f1629` / `#fff` |

### Project Colours

Each project has both `darkColor` and `lightColor`. Always access via `projColor(proj)` which reads `C.isDark`.

| Project              | Dark colour  | Light colour |
|----------------------|--------------|--------------|
| Mankoadze Resort     | `#c8f56a`    | `#2d7a0f`    |
| ECG Payor Automation | `#5ce1e6`    | `#0891b2`    |
| Susu App             | `#c4b5fd`    | `#7c3aed`    |
| Oak & Co             | `#f59e0b`    | `#d97706`    |

## Typography

| Role            | Font          | Weight    | Usage                                                  |
|-----------------|---------------|-----------|--------------------------------------------------------|
| Headings/titles | Space Grotesk | 700 / 800 | App name, greeting, section titles, task titles, modal headers |
| Labels/metadata | DM Mono       | 400 / 500 | Status badges, times, category labels, date strips, letter spacing 0.8–1.5 |

Both fonts loaded from Google Fonts:
```
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap
```

## Border Radius Scale

| Context                     | Value              |
|-----------------------------|--------------------|
| Status badges / pills       | `borderRadius: 20` |
| Inputs / selects            | `borderRadius: 13` |
| Buttons                     | `borderRadius: 16` |
| Small cards / dropdowns     | `borderRadius: 14` |
| Task cards / sheet sections | `borderRadius: 18` |
| Bottom sheets (top corners) | `"28px 28px 0 0"` |
| Day strip pills             | `borderRadius: 14` |
| Avatar circles              | `borderRadius: "50%"` |

## Spacing

- Page padding: `20px` horizontal on all main content areas.
- Header top padding: `48px` (accounts for status bar on mobile).
- Gap between task time column and task card column: `12px`.
- Gap between avatar circles in a group: `marginLeft: -9` (overlap).
- Notch overlap: status badge and avatars have `marginBottom: -14` to overlap the card body top.

## Animations

Defined as CSS keyframes — must be in the global style tag:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: none; opacity: 1; }
}
```

- Task cards: `animation: fadeUp .3s ease both` — stagger with `animationDelay` per card index.
- Bottom sheets (AddSheet, DetailSheet, ProfileSheet): `animation: slideUp .28s cubic-bezier(.34,1.2,.64,1)`.

## Layout Patterns

### Header
- Full-width, `padding: "48px 20px 0"`.
- Left: date label (DM Mono, 10px, muted) + greeting (Space Grotesk, 800, 24px) + subtitle (DM Mono, 11px, muted).
- Right: theme toggle pill + avatar with notification badge dot.
- Theme toggle: 44×26px pill, circle slides left (dark) or right (light).
- Notification badge: red circle (`#f87171`), 16×16px, `border: 2px solid C.bg`, top-right of avatar.

### Day Strip
- Month nav: left arrow / "Month Year" (Space Grotesk 700, 16px) / right arrow.
- Strip: horizontal scroll, `overflow-x: auto`, scrollbar hidden.
- Day pills: 48px wide, `padding: "10px 0 8px"`, `borderRadius: 14`, `gap: 3` between number and weekday.
- Selected: `C.accent` background, `C.bg` text.
- Today (unselected): `C.surface` background, `C.accent` text, `1.5px solid C.accent + "55"` border.
- Task dot: 4×4px circle, `C.accent` colour (or `C.bg+"77"` if selected day).

### Task Card (the signature element)
```
[Status badge pill]         [Avatar row] [+] [Progress bar] [XX%]
┌────────────────────────────────────────────────────────────────┐
│  [Diamond icon]   Task Title                              [⋮]  │
│                   category label  ·  ⬡ Project name           │
└────────────────────────────────────────────────────────────────┘
```
- Status badge: `marginBottom: -14` pulls it down onto the card top edge.
- Card body background: `STATUS[task.status].color + "20"` (20% opacity tint).
- Card border: `1.5px solid STATUS[task.status].color + "44"`.
- Diamond icon: 44×44px div, `transform: rotate(45deg)`, icon text counter-rotated `-45deg`.
- Kebab menu: positioned `absolute`, top 32px, right 10px, `zIndex: 20`.

### Bottom Sheets (AddSheet, DetailSheet, ProfileSheet)
- Overlay: `position: fixed, inset: 0, background: "#000a"` — tapping overlay closes the sheet.
- Sheet: `maxWidth: 430, background: C.surface, borderRadius: "28px 28px 0 0"`.
- Handle bar: 36×4px, `C.muted+"44"`, centered, `margin: "0 auto 22px"`.
- Max height: `92dvh` with `overflowY: auto` for scrollable content.
- All sheets use `slideUp` animation.

### Profile Sheet Tabs
- Two tabs: Account | Notifications.
- Tab bar: `borderBottom: 2.5px solid` — accent for active, `C.muted+"33"` for inactive.
- Notification badge on Notifications tab label: red pill with unread count.
- Inside Notifications tab: Inbox / Cleared sub-tabs with the same underline pattern.

### Bottom Navigation
- `position: fixed, bottom: 0`, full width, `maxWidth: 430`.
- Background: `C.surface`, `borderTop: 1.5px solid C.muted+"22"`.
- Padding: `"10px 0 24px"` (24px accounts for home indicator on mobile).
- Two tabs: Tasks (▣) and Dashboard (◈).
- Active: `C.accent`. Inactive: `C.muted`.

### FAB (+ button)
- `position: fixed, bottom: 82, right: "max(20px, calc(50% - 195px))"`.
- 54×54px circle, `C.accent` background, `C.bg` text (dark) or `#ffffff` (light).
- `boxShadow: "0 8px 28px C.accent + 55"`.

### Notification Rows (inside ProfileSheet)
- Icon: 34×34px rounded square, `typeColor+"22"` background, `typeColor+"44"` border.
- Type label: 9px DM Mono, `typeColor`, uppercase, letterSpacing 0.8, above the body text.
- Unread dot: 6×6px circle, `C.accent`, inline after title text.
- "Tap to open task" hint: 9px DM Mono, `C.muted+"88"`, below body text — inbox only.
- Cleared items: `opacity: 0.55`.

## Notification Type Visual Reference

| Type           | Icon | Colour (dark)  | Colour (light) |
|----------------|------|----------------|----------------|
| assigned       | ◈    | `C.accent`     | `C.accent`     |
| status_change  | ◆    | `C.purple`     | `C.purple`     |
| reminder       | ◉    | `C.cyan`       | `C.cyan`       |
| nudge_overdue  | ▲    | `#f87171`      | `#f87171`      |
| nudge_stalled  | ◐    | `C.amber`      | `C.amber`      |

## Category Icons

| Category        | Icon |
|-----------------|------|
| Client project  | ◈    |
| Company task    | ◆    |
| Personal        | ◎    |
| Family task     | ◉    |

## Avatar System

- Size: 26–60px depending on context (26 in card notch, 36 in forms, 44 in header, 52 in profile sheet).
- Shape: `borderRadius: "50%"`.
- Background: person's assigned colour (generated from email hash for new people).
- Text: initials (up to 2 chars), DM Mono 700, `#0f1629` (dark text on coloured background).
- Border: `2.5px solid borderColor` — passes `C.surface` or `C.bg` depending on context.
- Overflow: after 3 avatars, show `+N` circle in `C.card` background.

## Scrollbar

Hidden on all scrollable containers:
```css
::-webkit-scrollbar { display: none; }
scrollbar-width: none;
```
