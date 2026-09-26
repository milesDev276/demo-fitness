import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/dbTestUtils'
import { db } from '../../db/db'
import { getProfile, updateProfile } from '../profile/repository'
import { EXPORT_VERSION, exportAllData, importAllData, validateImportPayload } from './exportImport'

function validPayload() {
  return {
    version: EXPORT_VERSION,
    exportedAt: '2026-01-01T00:00:00.000Z',
    userProfile: [],
    exercises: [{ id: 1, name: 'Bench Press', category: 'compound', equipment: 'barbell', primaryMuscle: 'chest' }],
    workoutPlans: [],
    workoutSessions: [],
    workoutSets: [],
    bodyLogs: [],
    dailyCheckIns: [],
    nutritionLogs: [],
  }
}

describe('validateImportPayload', () => {
  it('accepts a well-formed export', () => {
    expect(validateImportPayload(validPayload()).valid).toBe(true)
  })

  it('rejects null/non-object input', () => {
    expect(validateImportPayload(null).valid).toBe(false)
    expect(validateImportPayload('not json').valid).toBe(false)
    expect(validateImportPayload(42).valid).toBe(false)
  })

  it('rejects a mismatched version', () => {
    expect(validateImportPayload({ ...validPayload(), version: 999 }).valid).toBe(false)
  })

  it('rejects a payload missing a required table', () => {
    const payload = validPayload() as Record<string, unknown>
    delete payload.workoutSets
    expect(validateImportPayload(payload).valid).toBe(false)
  })

  it('rejects a payload where a table is not an array', () => {
    expect(validateImportPayload({ ...validPayload(), bodyLogs: 'oops' }).valid).toBe(false)
  })

  it('rejects rows with the wrong shape', () => {
    expect(validateImportPayload({ ...validPayload(), bodyLogs: [{ date: 'yesterday', weightKg: 80 }] }).valid).toBe(false)
    expect(validateImportPayload({ ...validPayload(), workoutSets: [null] }).valid).toBe(false)
    expect(validateImportPayload({ ...validPayload(), workoutSets: [{ sessionId: 1 }] }).valid).toBe(false)
    expect(validateImportPayload({ ...validPayload(), nutritionLogs: [{ date: '2026-01-01', calories: 'lots' }] }).valid).toBe(false)
  })

  it('rejects an export with no exercise library', () => {
    expect(validateImportPayload({ ...validPayload(), exercises: [] }).valid).toBe(false)
  })

  it('reports a friendly message, not a technical one', () => {
    const result = validateImportPayload({ ...validPayload(), bodyLogs: [{}] })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toMatch(/cannot be imported/)
  })
})

describe('export → import round trip', () => {
  beforeEach(resetDb)

  it('restores exported data after the database has been cleared', async () => {
    await updateProfile({ calorieTarget: 2400, availableDays: [1, 3, 5] })
    await db.bodyLogs.add({ date: '2026-09-20', weightKg: 79.5 })
    await db.nutritionLogs.add({ date: '2026-09-20', calories: 2350, proteinG: 145 })
    await db.dailyCheckIns.add({ date: '2026-09-20', sleepHours: 6, energy: 7, soreness: 3 })
    const sessionId = (await db.workoutSessions.add({
      planId: 1,
      planName: 'Upper',
      date: '2026-09-20',
      startTime: '2026-09-20T10:00:00.000Z',
      status: 'completed',
    })) as number
    await db.workoutSets.add({ sessionId, exerciseId: 1, setNumber: 1, weightKg: 60, reps: 10, rir: 2 })
    const exerciseCount = await db.exercises.count()

    // JSON round trip, exactly what a file on disk would go through.
    const exported = JSON.parse(JSON.stringify(await exportAllData()))
    await resetDb()
    expect(await db.bodyLogs.count()).toBe(0)

    const result = validateImportPayload(exported)
    expect(result.valid).toBe(true)
    if (!result.valid) return
    await importAllData(result.payload)

    expect((await db.bodyLogs.toArray()).map((l) => l.weightKg)).toEqual([79.5])
    expect((await db.nutritionLogs.toArray())[0].proteinG).toBe(145)
    expect((await db.dailyCheckIns.toArray())[0].energy).toBe(7)
    expect(await db.workoutSets.count()).toBe(1)
    expect(await db.workoutSessions.count()).toBe(1)
    expect(await db.exercises.count()).toBe(exerciseCount)
    const profile = await getProfile()
    expect(profile.calorieTarget).toBe(2400)
    expect(profile.availableDays).toEqual([1, 3, 5])
  })

  it('leaves existing data untouched when the write fails part-way', async () => {
    await db.bodyLogs.add({ date: '2026-09-20', weightKg: 80 })
    const result = validateImportPayload(validPayload())
    if (!result.valid) throw new Error('fixture should be valid')
    // An object is not a valid primary key, so this write fails after the tables were cleared.
    const broken = { ...result.payload, bodyLogs: [{ id: 1, date: '2026-09-21', weightKg: 78 }], workoutSets: [{ id: {} } as never] }
    await expect(importAllData(broken)).rejects.toBeDefined()
    expect((await db.bodyLogs.toArray())[0].weightKg).toBe(80)
  })
})
