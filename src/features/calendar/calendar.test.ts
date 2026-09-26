import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/dbTestUtils'
import { db } from '../../db/db'
import type { WorkoutPlan, WorkoutSession } from '../../db/types'
import { acceptWeeklyPlan } from '../adaptive/planner/repository'
import { generateWeeklyPlan } from '../adaptive/planner/weeklyPlanner'
import { completeSession, startSession } from '../workout/repository'
import { buildCalendarDays, markersFor, monthRange, monthWeeks, summarizeMonth, summarizeSets } from './calendar'
import { getCalendarMonth, hasCompletedWorkouts, isInPlannedWeek } from './repository'

const TODAY = '2026-09-23' // Wednesday

function plan(id: number, name: string, scheduledDate: string): WorkoutPlan {
  return { id, name, exercises: [], createdAt: 'x', updatedAt: 'x', isGenerated: true, scheduledDate, weekStart: '2026-09-21' }
}
function session(id: number, planId: number, date: string, status: WorkoutSession['status'] = 'completed'): WorkoutSession {
  return { id, planId, planName: `Plan ${planId}`, date, startTime: `${date}T10:00:00.000Z`, status }
}

describe('month grid', () => {
  it('lays September 2026 out Monday-first (Sep 1 is a Tuesday)', () => {
    const weeks = monthWeeks(2026, 8)
    expect(weeks[0]).toEqual([null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'])
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks.flat().filter(Boolean)).toHaveLength(30)
  })

  it('handles months that start on Monday and on Sunday, and leap Februaries', () => {
    expect(monthWeeks(2026, 5)[0][0]).toBe('2026-06-01') // June 2026 starts Monday
    expect(monthWeeks(2026, 1)[0][6]).toBe('2026-02-01') // Feb 2026 starts Sunday
    expect(monthWeeks(2028, 1).flat().filter(Boolean)).toHaveLength(29)
  })

  it('reports the first and last day of a month', () => {
    expect(monthRange(2026, 8)).toEqual({ start: '2026-09-01', end: '2026-09-30' })
  })
})

describe('day states', () => {
  it('marks completed, planned and missed days', () => {
    const days = buildCalendarDays({
      sessions: [session(1, 1, '2026-09-21')],
      plans: [plan(1, 'Done', '2026-09-21'), plan(2, 'Missed', '2026-09-22'), plan(3, 'Later', '2026-09-25'), plan(4, 'Today', TODAY)],
      completedPlanIds: new Set([1]),
      today: TODAY,
    })
    expect(markersFor(days.get('2026-09-21'))).toEqual(['completed'])
    expect(markersFor(days.get('2026-09-22'))).toEqual(['missed'])
    expect(markersFor(days.get(TODAY))).toEqual(['planned'])
    expect(markersFor(days.get('2026-09-25'))).toEqual(['planned'])
    expect(markersFor(days.get('2026-09-24'))).toEqual([]) // rest day: nothing to draw
  })

  it('never shows a planned workout as done unless a completed session used it', () => {
    const days = buildCalendarDays({ sessions: [], plans: [plan(1, 'Upper', '2026-09-21')], completedPlanIds: new Set(), today: TODAY })
    expect(days.get('2026-09-21')?.completed).toEqual([])
    expect(markersFor(days.get('2026-09-21'))).toEqual(['missed'])
  })

  it('ignores in-progress sessions', () => {
    const days = buildCalendarDays({ sessions: [session(1, 1, TODAY, 'in_progress')], plans: [], completedPlanIds: new Set(), today: TODAY })
    expect(markersFor(days.get(TODAY))).toEqual([])
  })

  it('shows a workout done on a different day than planned only on the day it happened', () => {
    const days = buildCalendarDays({
      sessions: [session(1, 1, '2026-09-23')],
      plans: [plan(1, 'Upper', '2026-09-21')],
      completedPlanIds: new Set([1]),
      today: TODAY,
    })
    expect(markersFor(days.get('2026-09-21'))).toEqual([])
    expect(markersFor(days.get('2026-09-23'))).toEqual(['completed'])
  })

  it('summarises only reliable figures', () => {
    const days = buildCalendarDays({
      sessions: [session(1, 1, '2026-09-21'), session(2, 2, '2026-09-22')],
      plans: [plan(3, 'A', TODAY), plan(4, 'B', '2026-09-25'), plan(5, 'Missed', '2026-09-20')],
      completedPlanIds: new Set([1, 2]),
      today: TODAY,
    })
    expect(summarizeMonth(days)).toEqual({ completed: 2, plannedAhead: 2 })
  })
})

describe('set summaries', () => {
  it('collapses identical sets', () => expect(summarizeSets([{ weightKg: 50, reps: 10 }, { weightKg: 50, reps: 10 }, { weightKg: 50, reps: 10 }])).toBe('50kg × 10 × 3'))
  it('lists reps when they vary at one weight', () => expect(summarizeSets([{ weightKg: 50, reps: 10 }, { weightKg: 50, reps: 10 }, { weightKg: 50, reps: 9 }])).toBe('50kg × 10 · 10 · 9'))
  it('lists each set when the weight changes', () => expect(summarizeSets([{ weightKg: 50, reps: 10 }, { weightKg: 55, reps: 8 }])).toBe('50kg × 10 · 55kg × 8'))
  it('handles bodyweight work', () => expect(summarizeSets([{ weightKg: 0, reps: 12 }, { weightKg: 0, reps: 12 }])).toBe('12 reps × 2'))
})

/** Markers for one date, reading the month that contains it (so tests don't depend on the real clock's month). */
async function markersOn(date: string, today: string) {
  const month = await getCalendarMonth(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, today)
  return markersFor(month.get(date))
}

function planRow(name: string, scheduledDate: string): Omit<WorkoutPlan, 'id'> {
  const { id: _omit, ...row } = plan(0, name, scheduledDate)
  void _omit
  return row
}

describe('calendar reads existing data only', () => {
  beforeEach(resetDb)

  it('shows a plan as planned, and a completed workout on the day it was actually done', async () => {
    const id = (await db.workoutPlans.add(planRow('Upper', TODAY))) as number
    const stored = (await db.workoutPlans.get(id))!

    expect(await markersOn(TODAY, TODAY)).toEqual(['planned'])
    expect(await hasCompletedWorkouts()).toBe(false)

    const sessionId = await startSession(stored)
    expect(await markersOn(TODAY, TODAY)).toEqual(['planned']) // started is not completed

    await completeSession(sessionId)
    const done = (await db.workoutSessions.get(sessionId))!
    expect(await hasCompletedWorkouts()).toBe(true)
    expect(await markersOn(done.date, done.date)).toEqual(['completed'])
    // The planned day is no longer pending or missed: its workout was done (on the date it was done).
    if (done.date !== TODAY) expect(await markersOn(TODAY, done.date)).toEqual([])
  })

  it('reading the calendar never writes anything', async () => {
    await db.workoutPlans.add(planRow('Upper', TODAY))
    const counts = async () => [await db.workoutPlans.count(), await db.workoutSessions.count(), await db.workoutSets.count()]
    const before = await counts()
    await getCalendarMonth(2026, 8, TODAY)
    await isInPlannedWeek(TODAY)
    expect(await counts()).toEqual(before)
  })

  it('keeps completed workouts intact when the week is planned again', async () => {
    const exercises = await db.exercises.toArray()
    const week = () =>
      generateWeeklyPlan({
        today: '2026-09-21',
        planFor: 'this',
        availableDays: [1, 3, 5],
        trainingDaysPerWeek: 3,
        sessionDurationMinutes: 60,
        goalMuscularEmphasis: 0.5,
        goalAthleticEmphasis: 0.5,
        experience: 'beginner',
        equipment: ['gym'],
        exercises,
        recentSessions: [],
        previousPlanExerciseIds: [],
        recovery: null,
      })

    await acceptWeeklyPlan(week())
    const first = (await db.workoutPlans.toArray()).sort((a, b) => a.scheduledDate!.localeCompare(b.scheduledDate!))[0]
    const sessionId = await startSession(first)
    await completeSession(sessionId)
    const sessionsBefore = await db.workoutSessions.toArray()

    await acceptWeeklyPlan(week()) // plan the same week again

    expect(await db.workoutSessions.toArray()).toEqual(sessionsBefore)
    expect(await db.workoutPlans.get(first.id!)).toBeDefined() // the plan a completed session used is kept
    const done = sessionsBefore[0]
    expect(await markersOn(done.date, done.date)).toEqual(['completed'])
  })

  it('distinguishes a rest day (inside a planned week) from an unplanned week', async () => {
    await db.workoutPlans.add(planRow('Upper', TODAY))
    expect(await isInPlannedWeek('2026-09-24')).toBe(true) // same Mon–Sun week as the plan
    expect(await isInPlannedWeek('2026-10-08')).toBe(false)
  })
})
