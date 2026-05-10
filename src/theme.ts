export const DARK = {
  bg:      '#0f1629',
  surface: '#16213e',
  card:    '#1a2744',
  accent:  '#c8f56a',
  cyan:    '#5ce1e6',
  purple:  '#c4b5fd',
  amber:   '#f59e0b',
  muted:   '#6b7a99',
  text:    '#e8eaf6',
  dim:     '#8892b0',
  isDark:  true,
}

export const LIGHT = {
  bg:      '#f0f3fa',
  surface: '#ffffff',
  card:    '#e8edf7',
  accent:  '#2d7a0f',
  cyan:    '#0891b2',
  purple:  '#7c3aed',
  amber:   '#d97706',
  muted:   '#94a3b8',
  text:    '#1a2340',
  dim:     '#4a5a7a',
  isDark:  false,
}

// Module-level ref — swapped by ThemeProvider before each render
export let C = DARK

export const STATUS_DARK = {
  todo:      { label: 'Todo',      color: '#94a3b8', fg: '#0f1629' },
  completed: { label: 'Completed', color: '#c8f56a', fg: '#0f1629' },
  running:   { label: 'Running',   color: '#c4b5fd', fg: '#0f1629' },
  pending:   { label: 'Pending',   color: '#f59e0b', fg: '#0f1629' },
  rejected:  { label: 'Rejected',  color: '#5ce1e6', fg: '#0f1629' },
}

export const STATUS_LIGHT = {
  todo:      { label: 'Todo',      color: '#64748b', fg: '#ffffff' },
  completed: { label: 'Completed', color: '#2d7a0f', fg: '#ffffff' },
  running:   { label: 'Running',   color: '#7c3aed', fg: '#ffffff' },
  pending:   { label: 'Pending',   color: '#d97706', fg: '#ffffff' },
  rejected:  { label: 'Rejected',  color: '#0891b2', fg: '#ffffff' },
}

// Module-level ref — swapped alongside C
export let STATUS = STATUS_DARK

export function swapTheme(isDark: boolean) {
  C      = isDark ? DARK       : LIGHT
  STATUS = isDark ? STATUS_DARK : STATUS_LIGHT
}

export const REMINDER_OPTIONS = [
  { value: '',     label: 'No reminder'    },
  { value: '10',   label: '10 min before'  },
  { value: '30',   label: '30 min before'  },
  { value: '60',   label: '1 hour before'  },
  { value: '180',  label: '3 hours before' },
  { value: '1440', label: '1 day before'   },
]

export const CAT_ICON: Record<string, string> = {
  'Client project': '◈',
  'Company task':   '◆',
  'Personal':       '◎',
  'Family task':    '◉',
}

export const AVATAR_COLORS = [
  '#c8f56a','#5ce1e6','#c4b5fd','#f59e0b',
  '#f87171','#34d399','#60a5fa','#f472b6',
]

export function colorForEmail(email: string): string {
  let h = 0
  for (let i = 0; i < email.length; i++) {
    h = (h * 31 + email.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[h]
}

export function initialsFor(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}

export function projColor(proj: { dark_color: string; light_color: string }): string {
  return C.isDark ? proj.dark_color : (proj.light_color || proj.dark_color)
}
