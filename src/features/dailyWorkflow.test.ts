import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../test/dbTestUtils'
import { db } from '../db/db'
import { todayLocalDate } from '../utils/date'
import { getCurrentWeightKg, getTodayBodyLog, upsertBodyLog } from './body/repository'
import { addMeal, deleteMeal, getTodayNutritionLog, upsertNutritionTotals } from './nutrition/repository'
import { getTodayCheckIn, upsertCheckIn } from './recovery/repository'
import { getProfile, updateProfile } from './profile/repository'
import {
  addSet,
  completeSession,
  createPlan,
  getPlan,
  getPreviousPerformance,
  getSessionSummary,
  getSessionsForDate,
  startSession,
} from './workout/repository'

beforeEach(resetDb)

describe('body logging', () => {
  it('creates today’s log, then updates the same row rather than adding duplicates', async () => {
    await upsertBodyLog({ weightKg: 80 })
    await upsertBodyLog({ waistCm: 88 })
    await upsertBodyLog({ weightKg: 79.6 })
    expect(await db.bodyLogs.count()).toBe(1)
    const log = await getTodayBodyLog()
    expect(log?.weightKg).toBe(79.6)
    expect(log?.waistCm).toBe(88)
  })

  it('treats the latest BodyLog weight as authoritative over the profile baseline', async () => {
    expect((await getProfile()).weightKg).toBe(80)
    expect(await getCurrentWeightKg()).toBeUndefined()

    await db.bodyLogs.add({ date: '2026-09-01', weightKg: 79 })
    await db.bodyLogs.add({ date: '2026-09-10', weightKg: 78 })
    await db.bodyLogs.add({ date: '2026-09-12', waistCm: 87 }) // newer, but no weight
    expect(await getCurrentWeightKg()).toBe(78)
  })
})

describe('quick successive saves', () => {
  it('never create duplicate rows for today', async () => {
    await Promise.all([
      upsertBodyLog({ weightKg: 80 }),
      upsertBodyLog({ waistCm: 88 }),
      upsertNutritionTotals({ calories: 2000 }),
      upsertNutritionTotals({ proteinG: 140 }),
      addMeal({ name: 'Snack', calories: 100, proteinG: 5, carbsG: 10, fatG: 2 }),
      upsertCheckIn({ sleepHours: 7 }),
      upsertCheckIn({ energy: 6 }),
      upsertCheckIn({ soreness: 2 }),
    ])
    expect(await db.bodyLogs.count()).toBe(1)
    expect(await db.nutritionLogs.count()).toBe(1)
    expect(await db.dailyCheckIns.count()).toBe(1)
    expect(await getTodayBodyLog()).toMatchObject({ weightKg: 80, waistCm: 88 })
    expect(await getTodayNutritionLog()).toMatchObject({ calories: 2000, proteinG: 140 })
    expect(await getTodayCheckIn()).toMatchObject({ sleepHours: 7, energy: 6, soreness: 2 })
  })

  it('never create a second profile row', async () => {
    await Promise.all([updateProfile({ calorieTarget: 2400 }), updateProfile({ proteinTarget: 150 }), updateProfile({ age: 25 })])
    expect(await db.userProfile.count()).toBe(1)
    expect(await getProfile()).toMatchObject({ calorieTarget: 2400, proteinTarget: 150, age: 25 })
  })
})

describe('nutrition logging', () => {
  it('stores totals for today and merges partial updates', async () => {
    await upsertNutritionTotals({ calories: 2350 })
    await upsertNutritionTotals({ proteinG: 145 })
    expect(await db.nutritionLogs.count()).toBe(1)
    const log = await getTodayNutritionLog()
    expect(log).toMatchObject({ calories: 2350, proteinG: 145, date: todayLocalDate() })
  })

  it('adds and removes meals without touching the totals', async () => {
    await upsertNutritionTotals({ calories: 1000 })
    await addMeal({ name: 'Oats', calories: 400, proteinG: 20, carbsG: 60, fatG: 8 })
    await addMeal({ name: 'Chicken', calories: 500, proteinG: 45, carbsG: 30, fatG: 10 })
    const withMeals = await getTodayNutritionLog()
    expect(withMeals?.meals).toHaveLength(2)

    await deleteMeal(withMeals!.meals![0].id)
    const after = await getTodayNutritionLog()
    expect(after?.meals?.map((m) => m.name)).toEqual(['Chicken'])
    expect(after?.calories).toBe(1000)
  })
})

describe('recovery logging', () => {
  it('keeps sleep, energy and soreness on one row for today', async () => {
    await upsertCheckIn({ sleepHours: 6 })
    await upsertCheckIn({ energy: 7 })
    await upsertCheckIn({ soreness: 3 })
    await upsertCheckIn({ energy: 8 }) // re-tapping a scale value replaces it
    expect(await db.dailyCheckIns.count()).toBe(1)
    expect(await getTodayCheckIn()).toMatchObject({ sleepHours: 6, energy: 8, soreness: 3 })
  })
})

describe('workout completion', () => {
  it('logs sets, completes the session and reports an accurate summary', async () => {
    const [bench, row] = await db.exercises.toCollection().limit(2).toArray()
    const planId = await createPlan('Upper Strength', [
      { exerciseId: bench.id!, order: 0, targetSets: 3, minReps: 8, maxReps: 10, targetRIR: 2 },
      { exerciseId: row.id!, order: 1, targetSets: 3, minReps: 8, maxReps: 10, targetRIR: 2 },
    ])
    const plan = (await getPlan(planId))!
    const sessionId = await startSession(plan)

    await addSet({ sessionId, exerciseId: bench.id!, weightKg: 60, reps: 10, rir: 2 })
    await addSet({ sessionId, exerciseId: bench.id!, weightKg: 60, reps: 10, rir: 2 })
    await addSet({ sessionId, exerciseId: row.id!, weightKg: 50, reps: 8, rir: 1 })

    await completeSession(sessionId)

    const [session] = await getSessionsForDate(todayLocalDate())
    expect(session.status).toBe('completed')
    expect(session.durationMinutes).toBeGreaterThanOrEqual(1)

    expect(await getSessionSummary(sessionId)).toEqual({
      exerciseCount: 2,
      setCount: 3,
      volumeKg: 60 * 10 * 2 + 50 * 8,
    })

    // The completed session becomes the "last time" reference for the next workout.
    const previous = await getPreviousPerformance(bench.id!)
    expect(previous?.sets.map((s) => s.reps)).toEqual([10, 10])
  })
})
