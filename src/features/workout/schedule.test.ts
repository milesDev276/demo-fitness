import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/dbTestUtils'
import { db } from '../../db/db'
import type { WorkoutPlan } from '../../db/types'
import { formatSet } from '../../utils/format'
import { getDefaultPlanTarget } from '../adaptive/planner/repository'
import { updateProfile } from '../profile/repository'
import { restSecondsFor } from './restDuration'
import { getNextWorkout, listManualPlans, listScheduledPlans, startSession, completeSession } from './repository'

// 2026-09-23 is a Wednesday; its week runs Mon 2026-09-21 – Sun 2026-09-27.
const TODAY = '2026-09-23'

function generated(name: string, scheduledDate: string): Omit<WorkoutPlan, 'id'> {
  return {
    name,
    exercises: [],
    createdAt: 'x',
    updatedAt: 'x',
    isGenerated: true,
    scheduledDate,
    weekStart: '2026-09-21',
    estimatedDurationMinutes: 60,
  }
}

beforeEach(resetDb)

describe('what Today should offer (getNextWorkout)', () => {
  it('returns null when nothing is planned', async () => {
    expect(await getNextWorkout(TODAY)).toBeNull()
  })

  it('prefers the workout scheduled for today', async () => {
    await db.workoutPlans.bulkAdd([generated('Mon', '2026-09-21'), generated('Wed', TODAY), generated('Fri', '2026-09-25')])
    const next = await getNextWorkout(TODAY)
    expect(next?.plan.name).toBe('Wed')
    expect(next?.status).toBe('today')
  })

  it('offers a recently missed workout before a later upcoming one', async () => {
    await db.workoutPlans.bulkAdd([generated('Mon', '2026-09-21'), generated('Fri', '2026-09-25')])
    const next = await getNextWorkout(TODAY)
    expect(next?.plan.name).toBe('Mon')
    expect(next?.status).toBe('missed')
  })

  it('offers the next upcoming workout when today has none', async () => {
    await db.workoutPlans.bulkAdd([generated('Fri', '2026-09-25'), generated('Sat', '2026-09-26')])
    const next = await getNextWorkout(TODAY)
    expect(next?.plan.name).toBe('Fri')
    expect(next?.status).toBe('upcoming')
  })

  it('ignores workouts missed more than a few days ago', async () => {
    await db.workoutPlans.bulkAdd([generated('Old', '2026-09-14')])
    expect(await getNextWorkout(TODAY)).toBeNull()
  })

  it('skips workouts that are already completed', async () => {
    const [wed, fri] = (await db.workoutPlans.bulkAdd([generated('Wed', TODAY), generated('Fri', '2026-09-25')], { allKeys: true })) as number[]
    const sessionId = await startSession({ ...generated('Wed', TODAY), id: wed })
    await completeSession(sessionId)
    const next = await getNextWorkout(TODAY)
    expect(next?.plan.id).toBe(fri)
    const all = await listScheduledPlans(TODAY)
    expect(all.find((s) => s.plan.id === wed)?.status).toBe('done')
  })
})

describe('workout lists', () => {
  it('keeps hand-made workouts separate from planner-generated ones', async () => {
    await db.workoutPlans.bulkAdd([
      generated('Generated', TODAY),
      { name: 'My routine', exercises: [], createdAt: 'x', updatedAt: 'x' },
    ])
    expect((await listManualPlans()).map((p) => p.name)).toEqual(['My routine'])
    expect((await listScheduledPlans(TODAY)).map((s) => s.plan.name)).toEqual(['Generated'])
  })

  it('hides generated workouts from earlier weeks', async () => {
    await db.workoutPlans.bulkAdd([generated('LastWeek', '2026-09-16'), generated('ThisWeek', TODAY)])
    expect((await listScheduledPlans(TODAY)).map((s) => s.plan.name)).toEqual(['ThisWeek'])
  })
})

describe('default planning target', () => {
  // The planner reads the real clock, so only assert the parts that don't depend on today's date.
  it('plans next week when the profile has no available days left to use', async () => {
    await updateProfile({ availableDays: [] })
    expect(await getDefaultPlanTarget()).toBe('next')
  })

  it('plans the rest of this week when the current week has no plan yet and a training day remains', async () => {
    await updateProfile({ availableDays: [0, 1, 2, 3, 4, 5, 6] }) // every day, so today or later always qualifies
    expect(await getDefaultPlanTarget()).toBe('this')
  })
})

describe('formatting helpers', () => {
  it('formats loaded and unloaded sets', () => {
    expect(formatSet(60, 8)).toBe('60kg × 8')
    expect(formatSet(0, 12)).toBe('12 reps')
  })

  it('rests longer after compound lifts than isolation work', () => {
    expect(restSecondsFor('compound')).toBeGreaterThan(restSecondsFor('isolation'))
    expect(restSecondsFor(undefined)).toBe(90)
  })
})
