import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { db } from './db'
import { getProfile } from '../features/profile/repository'

describe('database upgrade', () => {
  it('keeps existing data when a version-1 database is opened by the current schema', async () => {
    // Recreate the Phase 1 database exactly as an existing install would have it.
    const old = new Dexie('fitflow')
    old.version(1).stores({
      userProfile: '++id',
      exercises: '++id, name, category, equipment, primaryMuscle, movementPattern, isBodyweight',
      workoutPlans: '++id, name, createdAt',
      workoutSessions: '++id, planId, date, status',
      workoutSets: '++id, sessionId, exerciseId',
      bodyLogs: '++id, date',
      dailyCheckIns: '++id, date',
      nutritionLogs: '++id, date',
    })
    await old.open()
    await old.table('bodyLogs').add({ date: '2026-08-01', weightKg: 81 })
    await old.table('exercises').add({ name: 'Bench Press', category: 'compound', equipment: 'barbell', primaryMuscle: 'chest' })
    await old.table('workoutPlans').add({ name: 'Old plan', exercises: [], createdAt: 'x', updatedAt: 'x' })
    // A profile saved before availableDays / equipment / targets existed.
    await old.table('userProfile').add({
      age: 24,
      sex: 'male',
      heightCm: 170,
      weightKg: 80,
      experience: 'beginner',
      trainingDaysPerWeek: 4,
      sessionDurationMinutes: 60,
      goalMuscularEmphasis: 0.5,
      goalAthleticEmphasis: 0.5,
      createdAt: 'x',
      updatedAt: 'x',
    })
    old.close()

    await db.open()

    expect((await db.bodyLogs.toArray()).map((l) => l.weightKg)).toEqual([81])
    expect((await db.exercises.toArray()).map((e) => e.name)).toEqual(['Bench Press'])
    expect((await db.workoutPlans.toArray()).map((p) => p.name)).toEqual(['Old plan'])
    expect(await db.bodyPhotos.count()).toBe(0) // the new Phase 6 table exists and is usable

    // The old profile row must not crash the settings screen: missing fields are filled from defaults.
    const profile = await getProfile()
    expect(profile.sessionDurationMinutes).toBe(60) // stored value wins
    expect(Array.isArray(profile.availableDays)).toBe(true)
    expect(profile.equipment).toEqual(['gym'])
  })
})
