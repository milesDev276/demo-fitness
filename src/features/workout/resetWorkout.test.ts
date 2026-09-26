import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDb } from '../../test/dbTestUtils'
import { db } from '../../db/db'
import type { WorkoutPlan } from '../../db/types'
import { todayLocalDate } from '../../utils/date'
import { upsertBodyLog } from '../body/repository'
import { upsertNutritionTotals } from '../nutrition/repository'
import { updateProfile } from '../profile/repository'
import { upsertCheckIn } from '../recovery/repository'
import { addSet, completeSession, getNextWorkout, resetWorkout, startSession } from './repository'

const today = todayLocalDate()

function todaysPlan(name: string): Omit<WorkoutPlan, 'id'> {
  return { name, exercises: [], createdAt: 'x', updatedAt: 'x', isGenerated: true, scheduledDate: today, weekStart: today }
}

async function planWithSession(name: string) {
  const planId = (await db.workoutPlans.add(todaysPlan(name))) as number
  const plan = (await db.workoutPlans.get(planId))!
  const sessionId = await startSession(plan)
  return { plan, sessionId }
}

const counts = async () => ({
  plans: await db.workoutPlans.count(),
  sessions: await db.workoutSessions.count(),
  sets: await db.workoutSets.count(),
  body: await db.bodyLogs.count(),
  nutrition: await db.nutritionLogs.count(),
  recovery: await db.dailyCheckIns.count(),
  profiles: await db.userProfile.count(),
  exercises: await db.exercises.count(),
})

beforeEach(resetDb)

describe('reset a workout that is in progress', () => {
  it('removes its sets and session, and keeps the planned workout', async () => {
    const { plan, sessionId } = await planWithSession('Upper')
    await addSet({ sessionId, exerciseId: 1, weightKg: 60, reps: 10, rir: 2 })
    await addSet({ sessionId, exerciseId: 1, weightKg: 60, reps: 9, rir: 1 })

    await resetWorkout(sessionId)

    expect(await db.workoutSets.count()).toBe(0)
    expect(await db.workoutSessions.count()).toBe(0)
    expect(await db.workoutPlans.get(plan.id!)).toBeDefined()
  })

  it('returns the workout to planned so it can be started again', async () => {
    const { plan, sessionId } = await planWithSession('Upper')
    await resetWorkout(sessionId)
    const next = await getNextWorkout(today)
    expect(next?.plan.id).toBe(plan.id)
    expect(next?.status).toBe('today')
  })
})

describe('reset a completed workout', () => {
  it('reverts it to planned without leaving a history record behind', async () => {
    const { plan, sessionId } = await planWithSession('Upper')
    await addSet({ sessionId, exerciseId: 1, weightKg: 60, reps: 10, rir: 2 })
    await completeSession(sessionId)
    expect(await getNextWorkout(today)).toBeNull() // done, so nothing is pending

    await resetWorkout(sessionId)

    expect(await db.workoutSessions.where('status').equals('completed').count()).toBe(0)
    expect(await db.workoutSets.count()).toBe(0)
    expect((await getNextWorkout(today))?.plan.id).toBe(plan.id)
  })

  it('does not create duplicate history when the workout is done again', async () => {
    const { plan, sessionId } = await planWithSession('Upper')
    await addSet({ sessionId, exerciseId: 1, weightKg: 60, reps: 10, rir: 2 })
    await completeSession(sessionId)
    await resetWorkout(sessionId)

    const again = await startSession(plan)
    await addSet({ sessionId: again, exerciseId: 1, weightKg: 62.5, reps: 8, rir: 2 })
    await completeSession(again)

    const completed = await db.workoutSessions.where('status').equals('completed').toArray()
    expect(completed).toHaveLength(1)
    expect(completed[0].id).toBe(again)
    expect(await db.workoutSets.count()).toBe(1)
  })
})

describe('reset is scoped to one workout', () => {
  it('leaves every other record untouched', async () => {
    // An earlier completed workout with its own sets, plus the workout being reset.
    const past = await planWithSession('Yesterday')
    await addSet({ sessionId: past.sessionId, exerciseId: 1, weightKg: 50, reps: 10, rir: 2 })
    await completeSession(past.sessionId)
    const current = await planWithSession('Today')
    await addSet({ sessionId: current.sessionId, exerciseId: 2, weightKg: 40, reps: 8, rir: 2 })

    await upsertBodyLog({ weightKg: 79 })
    await upsertNutritionTotals({ calories: 2300 })
    await upsertCheckIn({ energy: 7 })
    await updateProfile({ calorieTarget: 2400, availableDays: [1, 3, 5] })
    const before = await counts()
    const earlierSets = await db.workoutSets.where('sessionId').equals(past.sessionId).toArray()

    await resetWorkout(current.sessionId)

    expect(await counts()).toEqual({ ...before, sessions: before.sessions - 1, sets: before.sets - 1 })
    expect(await db.workoutSets.where('sessionId').equals(past.sessionId).toArray()).toEqual(earlierSets)
    expect((await db.workoutSessions.get(past.sessionId))?.status).toBe('completed')
    expect((await db.bodyLogs.toArray())[0].weightKg).toBe(79)
    expect((await db.userProfile.toArray())[0]).toMatchObject({ calorieTarget: 2400, availableDays: [1, 3, 5] })
  })

  it('does nothing for a session that no longer exists', async () => {
    await planWithSession('Upper')
    const before = await counts()
    await resetWorkout(99999)
    expect(await counts()).toEqual(before)
  })
})

describe('reset failure', () => {
  it('changes nothing if any step fails (no partial reset)', async () => {
    const { sessionId } = await planWithSession('Upper')
    await addSet({ sessionId, exerciseId: 1, weightKg: 60, reps: 10, rir: 2 })
    await completeSession(sessionId)
    const before = await counts()

    // The sets are deleted first; make the session delete fail afterwards.
    vi.spyOn(db.workoutSessions, 'delete').mockRejectedValueOnce(new Error('disk full'))
    await expect(resetWorkout(sessionId)).rejects.toBeDefined()
    vi.restoreAllMocks()

    expect(await counts()).toEqual(before)
    expect((await db.workoutSessions.get(sessionId))?.status).toBe('completed')
    expect(await db.workoutSets.where('sessionId').equals(sessionId).count()).toBe(1)
  })
})
