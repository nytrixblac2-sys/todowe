export type TaskStatus = 'todo' | 'pending' | 'running' | 'completed' | 'rejected'
export type TaskCategory = 'Client project' | 'Company task' | 'Personal' | 'Family task'
export type NotificationType = 'assigned' | 'status_change' | 'reminder' | 'nudge_overdue' | 'nudge_stalled'

export interface Task {
  id: string
  owner_id: string
  project_id: string | null
  title: string
  category: TaskCategory
  status: TaskStatus
  progress: number
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  created_at: string
  assignees?: Person[]
  reminders?: string[] // minutes_before as strings, client-side only until Phase 4
}

export interface Project {
  id: string
  owner_id: string
  name: string
  dark_color: string
  light_color: string
  deadline: string | null
  created_at: string
}

export interface Person {
  id: string
  name: string
  email: string
  initials: string
  color: string
  avatar_url: string | null
}

export interface TaskReminder {
  id: string
  task_id: string
  minutes_before: number
  fired: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  task_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  cleared: boolean
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  initials: string
  color: string
  member_since: string
}
