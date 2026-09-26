import type { WorkoutPlan, WorkoutSession } from '../../db/types'
import { formatSet } from '../../utils/format'

/**
 * Pure calendar logic. The calendar owns no data: it is a view over completed WorkoutSessions and the
 * planner's generated WorkoutPlans, so nothing here can drift from workout history.
 */

export type DayMarker = 'completed' | 'planned' | 'missed'

export interface ScheduledEntry {
  plan: WorkoutPlan
  /** 'missed' only when the plan's date has passed and no completed session ever used it. */
  status: 'planned' | 'missed'
}

export interface CalendarDay {
  date: string
  completed: WorkoutSession[]
  scheduled: ScheduledEntry[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Weeks (Monday first) of a month as local ISO dates; days outside the month are null. `month` is 0-based. */
export function monthWeeks(year: number, month: number): (string | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0 .. Sun=6
  const cells: (string | null)[] = Array(leading).fill(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(`${year}-${pad(month + 1)}-${pad(day)}`)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function monthRange(year: number, month: number): { start: string; end: string } {
  const last = new Date(year, month + 1, 0).getDate()
  return { start: `${year}-${pad(month + 1)}-01`, end: `${year}-${pad(month + 1)}-${pad(last)}` }
}

interface BuildInput {
  /** Completed sessions only. */
  sessions: WorkoutSession[]
  /** Plans that have a scheduledDate (i.e. planner-generated). */
  plans: WorkoutPlan[]
  /** Every plan id that has ever been completed, so a plan done on another day isn't shown as pending. */
  completedPlanIds: Set<number>
  today: string
}

export function buildCalendarDays({ sessions, plans, completedPlanIds, today }: BuildInput): Map<string, CalendarDay> {
  const days = new Map<string, CalendarDay>()
  const dayFor = (date: string) => {
    let day = days.get(date)
    if (!day) {
      day = { date, completed: [], scheduled: [] }
      days.set(date, day)
    }
    return day
  }

  for (const session of sessions) {
    if (session.status === 'completed') dayFor(session.date).completed.push(session)
  }
  for (const plan of plans) {
    if (!plan.scheduledDate || completedPlanIds.has(plan.id!)) continue
    dayFor(plan.scheduledDate).scheduled.push({ plan, status: plan.scheduledDate < today ? 'missed' : 'planned' })
  }
  for (const day of days.values()) day.completed.sort((a, b) => a.startTime.localeCompare(b.startTime))
  return days
}

/** What to draw on a day cell, in a stable order: completed, then planned, then missed. */
export function markersFor(day: CalendarDay | undefined): DayMarker[] {
  if (!day) return []
  const markers: DayMarker[] = []
  if (day.completed.length > 0) markers.push('completed')
  if (day.scheduled.some((s) => s.status === 'planned')) markers.push('planned')
  if (day.scheduled.some((s) => s.status === 'missed')) markers.push('missed')
  return markers
}

/** Only figures that are always true: workouts done this month, and planned workouts still ahead (today or later). */
export function summarizeMonth(days: Map<string, CalendarDay>): { completed: number; plannedAhead: number } {
  let completed = 0
  let plannedAhead = 0
  for (const day of days.values()) {
    completed += day.completed.length
    plannedAhead += day.scheduled.filter((s) => s.status === 'planned').length
  }
  return { completed, plannedAhead }
}

/**
 * One line per exercise: "50kg × 10 × 3" when every set matched, "50kg × 10 · 10 · 9" when reps varied,
 * and each set listed when the weight changed. Unweighted sets read "10 reps × 3".
 */
export function summarizeSets(sets: { weightKg: number; reps: number }[]): string {
  if (sets.length === 0) return 'No sets logged'
  const sameWeight = sets.every((s) => s.weightKg === sets[0].weightKg)
  if (!sameWeight) return sets.map((s) => formatSet(s.weightKg, s.reps)).join(' · ')

  const { weightKg } = sets[0]
  const sameReps = sets.every((s) => s.reps === sets[0].reps)
  if (sameReps) return weightKg > 0 ? `${weightKg}kg × ${sets[0].reps} × ${sets.length}` : `${sets[0].reps} reps × ${sets.length}`
  const reps = sets.map((s) => s.reps).join(' · ')
  return weightKg > 0 ? `${weightKg}kg × ${reps}` : `${reps} reps`
}
