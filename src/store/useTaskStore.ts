import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus, TaskCategory } from '../types'

export interface TaskInput {
  title: string
  category: TaskCategory
  status: TaskStatus
  progress: number
  date: string
  start_time: string
  end_time: string
  project_id: string | null
  assignee_ids: string[]
  reminders: string[] // minutes_before strings
}

interface TaskStore {
  tasks: Record<string, Task[]> // keyed by YYYY-MM-DD
  loading: boolean
  fetchByDate: (date: string, userId: string) => Promise<void>
  fetchAll: (userId: string) => Promise<void>
  addTask: (input: TaskInput, ownerId: string) => Promise<Task | null>
  updateTask: (id: string, input: Partial<TaskInput>) => Promise<void>
  deleteTask: (id: string, date: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  loading: false,

  fetchByDate: async (date, userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_assignees(user_id),
        task_reminders(minutes_before)
      `)
      .or(`owner_id.eq.${userId},task_assignees.user_id.eq.${userId}`)
      .eq('date', date)
      .order('start_time')

    if (!error && data) {
      const mapped: Task[] = data.map(normalise)
      set((s) => ({ tasks: { ...s.tasks, [date]: mapped }, loading: false }))
    } else {
      set({ loading: false })
    }
  },

  fetchAll: async (userId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_assignees(user_id),
        task_reminders(minutes_before)
      `)
      .eq('owner_id', userId)
      .order('date')
      .order('start_time')

    if (!error && data) {
      const grouped: Record<string, Task[]> = {}
      for (const row of data) {
        const t = normalise(row)
        if (!grouped[t.date]) grouped[t.date] = []
        grouped[t.date].push(t)
      }
      set({ tasks: grouped, loading: false })
    } else {
      set({ loading: false })
    }
  },

  addTask: async (input, ownerId) => {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        owner_id:   ownerId,
        project_id: input.project_id,
        title:      input.title,
        category:   input.category,
        status:     input.status,
        progress:   input.progress,
        date:       input.date,
        start_time: input.start_time,
        end_time:   input.end_time,
      })
      .select()
      .single()

    if (error) {
      console.error('[addTask] Supabase insert error:', error.message, error.details, error.hint)
      throw new Error(error.message)
    }
    if (!task) {
      console.error('[addTask] No data returned from insert')
      throw new Error('Task creation returned no data')
    }

    const taskRow = task as Record<string, unknown>
    const taskId  = taskRow.id as string

    // Only insert assignees that are real Supabase auth UUIDs (not local_... ids)
    const validAssigneeIds = input.assignee_ids.filter(
      (uid) => !uid.startsWith('local_') && uid !== ownerId
    )
    if (validAssigneeIds.length > 0) {
      const { error: assigneeErr } = await supabase.from('task_assignees').insert(
        validAssigneeIds.map((uid) => ({ task_id: taskId, user_id: uid }))
      )
      if (assigneeErr) console.error('[addTask] Assignees insert error:', assigneeErr.message)
    }

    // Insert reminders
    if (input.reminders.length > 0) {
      const { error: reminderErr } = await supabase.from('task_reminders').insert(
        input.reminders.map((r) => ({ task_id: taskId, minutes_before: parseInt(r) }))
      )
      if (reminderErr) console.error('[addTask] Reminders insert error:', reminderErr.message)
    }

    const newTask: Task = {
      id:         taskId,
      owner_id:   taskRow.owner_id as string,
      project_id: taskRow.project_id as string | null,
      title:      taskRow.title as string,
      category:   taskRow.category as Task['category'],
      status:     taskRow.status as Task['status'],
      progress:   taskRow.progress as number,
      date:       taskRow.date as string,
      start_time: taskRow.start_time as string,
      end_time:   taskRow.end_time as string,
      created_at: taskRow.created_at as string,
      assignees:  [],
      reminders:  input.reminders,
    }

    set((s) => {
      const day = s.tasks[input.date] ?? []
      return { tasks: { ...s.tasks, [input.date]: [...day, newTask] } }
    })

    return newTask
  },

  updateTask: async (id, input) => {
    const updates: Record<string, unknown> = {}
    if (input.title      !== undefined) updates.title      = input.title
    if (input.category   !== undefined) updates.category   = input.category
    if (input.status     !== undefined) updates.status     = input.status
    if (input.progress   !== undefined) updates.progress   = input.progress
    if (input.start_time !== undefined) updates.start_time = input.start_time
    if (input.end_time   !== undefined) updates.end_time   = input.end_time
    if (input.project_id !== undefined) updates.project_id = input.project_id

    if (Object.keys(updates).length > 0) {
      await supabase.from('tasks').update(updates).eq('id', id)
    }

    if (input.assignee_ids !== undefined) {
      await supabase.from('task_assignees').delete().eq('task_id', id)
      if (input.assignee_ids.length > 0) {
        await supabase.from('task_assignees').insert(
          input.assignee_ids.map((uid) => ({ task_id: id, user_id: uid }))
        )
      }
    }

    if (input.reminders !== undefined) {
      await supabase.from('task_reminders').delete().eq('task_id', id)
      if (input.reminders.length > 0) {
        await supabase.from('task_reminders').insert(
          input.reminders.map((r) => ({ task_id: id, minutes_before: parseInt(r) }))
        )
      }
    }

    // Refresh the task in store
    const current = get().tasks
    const allDays = Object.entries(current)
    for (const [date, dayTasks] of allDays) {
      const idx = dayTasks.findIndex((t) => t.id === id)
      if (idx !== -1) {
        const updated = { ...dayTasks[idx], ...updates }
        if (input.reminders !== undefined) updated.reminders = input.reminders
        const newDay = [...dayTasks]
        newDay[idx] = updated
        set((s) => ({ tasks: { ...s.tasks, [date]: newDay } }))
        break
      }
    }
  },

  deleteTask: async (id, date) => {
    await supabase.from('tasks').delete().eq('id', id)
    set((s) => ({
      tasks: {
        ...s.tasks,
        [date]: (s.tasks[date] ?? []).filter((t) => t.id !== id),
      },
    }))
  },
}))

function normalise(row: Record<string, unknown>): Task {
  const assignees = (row.task_assignees as { user_id: string }[] | null) ?? []
  const reminders = (row.task_reminders as { minutes_before: number }[] | null) ?? []
  return {
    id:         row.id as string,
    owner_id:   row.owner_id as string,
    project_id: row.project_id as string | null,
    title:      row.title as string,
    category:   row.category as Task['category'],
    status:     row.status as Task['status'],
    progress:   row.progress as number,
    date:       row.date as string,
    start_time: row.start_time as string,
    end_time:   row.end_time as string,
    created_at: row.created_at as string,
    assignees:  assignees.map((a) => ({ id: a.user_id, name: '', email: '', initials: '', color: '', avatar_url: null })),
    reminders:  reminders.map((r) => String(r.minutes_before)),
  }
}
