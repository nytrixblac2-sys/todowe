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
  reminders: string[] // minutes_before as strings
}

interface TaskStore {
  tasks: Record<string, Task[]> // keyed by YYYY-MM-DD
  loading: boolean
  fetchAll: (userId: string) => Promise<void>
  addTask: (input: TaskInput, ownerId: string) => Promise<Task>
  updateTask: (id: string, input: Partial<TaskInput>) => Promise<void>
  deleteTask: (id: string, date: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  loading: false,

  fetchAll: async (userId) => {
    set({ loading: true })

    // Simple tasks-only query — no embedded resources (avoids FK-to-auth.users issues)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('owner_id', userId)
      .order('date')
      .order('start_time')

    if (error) {
      console.error('[fetchAll] tasks error:', error.message)
      set({ loading: false })
      return
    }

    // Separately fetch assignees and reminders
    const taskIds = (data ?? []).map((r) => r.id as string)
    let assigneeMap: Record<string, string[]>   = {}
    let reminderMap: Record<string, string[]>   = {}

    if (taskIds.length > 0) {
      const { data: assignees, error: ae } = await supabase
        .from('task_assignees')
        .select('task_id, user_id')
        .in('task_id', taskIds)

      if (ae) console.error('[fetchAll] assignees error:', ae.message)
      for (const a of assignees ?? []) {
        const id = a.task_id as string
        if (!assigneeMap[id]) assigneeMap[id] = []
        assigneeMap[id].push(a.user_id as string)
      }

      const { data: reminders, error: re } = await supabase
        .from('task_reminders')
        .select('task_id, minutes_before')
        .in('task_id', taskIds)

      if (re) console.error('[fetchAll] reminders error:', re.message)
      for (const r of reminders ?? []) {
        const id = r.task_id as string
        if (!reminderMap[id]) reminderMap[id] = []
        reminderMap[id].push(String(r.minutes_before))
      }
    }

    const grouped: Record<string, Task[]> = {}
    for (const row of data ?? []) {
      const t = buildTask(row, assigneeMap, reminderMap)
      if (!grouped[t.date]) grouped[t.date] = []
      grouped[t.date].push(t)
    }
    set({ tasks: grouped, loading: false })
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
      .select('*')
      .single()

    if (error) {
      console.error('[addTask] insert error:', error.message, error.details, error.hint)
      throw new Error(error.message)
    }
    if (!task) throw new Error('Task creation returned no data')

    const taskRow = task as Record<string, unknown>
    const taskId  = taskRow.id as string

    // Insert assignees — only real UUIDs (not local_ ids)
    const validIds = input.assignee_ids.filter((uid) => !uid.startsWith('local_'))
    if (validIds.length > 0) {
      const { error: ae } = await supabase
        .from('task_assignees')
        .insert(validIds.map((uid) => ({ task_id: taskId, user_id: uid })))
      if (ae) console.error('[addTask] assignees error:', ae.message)
    }

    // Insert reminders
    if (input.reminders.length > 0) {
      const { error: re } = await supabase
        .from('task_reminders')
        .insert(input.reminders.map((r) => ({ task_id: taskId, minutes_before: parseInt(r) })))
      if (re) console.error('[addTask] reminders error:', re.message)
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
      const { error } = await supabase.from('tasks').update(updates).eq('id', id)
      if (error) console.error('[updateTask] error:', error.message)
    }

    if (input.assignee_ids !== undefined) {
      await supabase.from('task_assignees').delete().eq('task_id', id)
      const validIds = input.assignee_ids.filter((uid) => !uid.startsWith('local_'))
      if (validIds.length > 0) {
        await supabase.from('task_assignees').insert(
          validIds.map((uid) => ({ task_id: id, user_id: uid }))
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

    // Optimistic state update
    const current = get().tasks
    for (const [date, dayTasks] of Object.entries(current)) {
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
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { console.error('[deleteTask] error:', error.message); return }
    set((s) => ({
      tasks: {
        ...s.tasks,
        [date]: (s.tasks[date] ?? []).filter((t) => t.id !== id),
      },
    }))
  },
}))

function buildTask(
  row: Record<string, unknown>,
  assigneeMap: Record<string, string[]>,
  reminderMap: Record<string, string[]>
): Task {
  const id = row.id as string
  return {
    id,
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
    assignees:  (assigneeMap[id] ?? []).map((uid) => ({
      id: uid, name: '', email: '', initials: '', color: '', avatar_url: null,
    })),
    reminders: reminderMap[id] ?? [],
  }
}
