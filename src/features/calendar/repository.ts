import { db } from '../../db/db'
import { mondayOnOrBefore } from '../../utils/date'
import { buildCalendarDays, monthRange } from './calendar'

/** Everything the month grid needs, read straight from existing tables (no calendar-specific storage). */
export async function getCalendarMonth(year: number, month: number, today: string) {
  const { start, end } = monthRange(year, month)
  const [monthSessions, plans, completed] = await Promise.all([
    db.workoutSessions.where('date').between(start, end, true, true).toArray(),
    db.workoutPlans.where('scheduledDate').between(start, end, true, true).toArray(),
    db.workoutSessions.where('status').equals('completed').toArray(),
  ])
  return buildCalendarDays({
    sessions: monthSessions.filter((s) => s.status === 'completed'),
    plans,
    completedPlanIds: new Set(completed.map((s) => s.planId)),
    today,
  })
}

/** True once the user has completed at least one workout — drives the "No workouts yet" empty state. */
export async function hasCompletedWorkouts(): Promise<boolean> {
  return (await db.workoutSessions.where('status').equals('completed').count()) > 0
}

/** A day with no workout is a "rest day" when its week has a plan; otherwise it's just unplanned. */
export async function isInPlannedWeek(date: string): Promise<boolean> {
  return (await db.workoutPlans.where('weekStart').equals(mondayOnOrBefore(date)).count()) > 0
}
