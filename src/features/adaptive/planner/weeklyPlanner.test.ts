import { describe, expect, it } from 'vitest'
import type { Exercise } from '../../../db/types'
import { generateWeeklyPlan } from './weeklyPlanner'
import type { PlannerHistorySession, WeeklyPlannerInput } from './types'

let nextId = 1
function exercise(partial: Omit<Exercise, 'id'>): Exercise {
  return { id: nextId++, ...partial }
}

const EXERCISES: Exercise[] = [
  exercise({ name: 'Barbell Bench Press', category: 'compound', equipment: 'barbell', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], movementPattern: 'push', isBodyweight: false }),
  exercise({ name: 'Overhead Press', category: 'compound', equipment: 'barbell', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], movementPattern: 'push', isBodyweight: false }),
  exercise({ name: 'Barbell Row', category: 'compound', equipment: 'barbell', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: false }),
  exercise({ name: 'Lat Pulldown', category: 'compound', equipment: 'cable', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: false }),
  exercise({ name: 'Lateral Raise', category: 'isolation', equipment: 'dumbbell', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'push', isBodyweight: false }),
  exercise({ name: 'Dumbbell Bicep Curl', category: 'isolation', equipment: 'dumbbell', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'pull', isBodyweight: false }),
  exercise({ name: 'Triceps Pushdown', category: 'isolation', equipment: 'cable', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'push', isBodyweight: false }),
  exercise({ name: 'Back Squat', category: 'compound', equipment: 'barbell', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', isBodyweight: false }),
  exercise({ name: 'Romanian Deadlift', category: 'compound', equipment: 'barbell', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes'], movementPattern: 'hinge', isBodyweight: false }),
  exercise({ name: 'Leg Press', category: 'compound', equipment: 'machine', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', isBodyweight: false }),
  exercise({ name: 'Leg Curl', category: 'isolation', equipment: 'machine', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'hinge', isBodyweight: false }),
  exercise({ name: 'Calf Raise', category: 'isolation', equipment: 'machine', primaryMuscle: 'calves', secondaryMuscles: [], movementPattern: 'squat', isBodyweight: false }),
  exercise({ name: 'Cable Crunch', category: 'isolation', equipment: 'cable', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'rotation', isBodyweight: false }),
  exercise({ name: 'Treadmill Run', category: 'cardio', equipment: 'machine', primaryMuscle: 'cardio', secondaryMuscles: ['quads'], movementPattern: 'locomotion', isBodyweight: false }),
  exercise({ name: 'Push-up', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], movementPattern: 'push', isBodyweight: true }),
  exercise({ name: 'Pull-up', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: true }),
  exercise({ name: 'Bodyweight Squat', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', isBodyweight: true }),
]

const GOOD_RECOVERY = { sleepHours: 8, energy: 8, soreness: 2 }
const POOR_RECOVERY = { sleepHours: 5, energy: 3, soreness: 8 }

function baseInput(overrides: Partial<WeeklyPlannerInput> = {}): WeeklyPlannerInput {
  return {
    today: '2026-09-22', // a Tuesday
    availableDays: [1, 2, 4, 6], // Mon, Tue, Thu, Sat
    trainingDaysPerWeek: 4,
    sessionDurationMinutes: 75,
    goalMuscularEmphasis: 0.5,
    goalAthleticEmphasis: 0.5,
    experience: 'beginner',
    equipment: ['gym'],
    exercises: EXERCISES,
    recentSessions: [],
    previousPlanExerciseIds: [],
    recovery: null,
    ...overrides,
  }
}

function heavySession(date: string, exerciseIds: number[]): PlannerHistorySession {
  return {
    date,
    sets: exerciseIds.flatMap((exerciseId) => [
      { exerciseId, weightKg: 60, reps: 8, rir: 2 },
      { exerciseId, weightKg: 60, reps: 8, rir: 2 },
      { exerciseId, weightKg: 60, reps: 8, rir: 2 },
    ]),
  }
}

describe('generateWeeklyPlan', () => {
  it('schedules exactly on the four available days when they match the target', () => {
    const result = generateWeeklyPlan(baseInput())
    expect(result.days).toHaveLength(4)
    const weekdays = result.days.map((d) => d.dayOfWeek).sort()
    expect(weekdays).toEqual([1, 2, 4, 6])
  })

  it('never schedules a session outside the available days', () => {
    const result = generateWeeklyPlan(baseInput({ availableDays: [1, 3, 6], trainingDaysPerWeek: 4 }))
    expect(result.days).toHaveLength(3)
    for (const day of result.days) {
      expect([1, 3, 6]).toContain(day.dayOfWeek)
    }
  })

  it('reduces to fewer sessions when fewer days are available than the target', () => {
    const result = generateWeeklyPlan(baseInput({ availableDays: [1, 3, 6], trainingDaysPerWeek: 4 }))
    expect(result.days).toHaveLength(3)
    expect(result.explanation.join(' ')).toMatch(/3.*available/i)
  })

  it('does not exceed the target frequency when more days are available', () => {
    const result = generateWeeklyPlan(
      baseInput({ availableDays: [1, 2, 3, 4, 5, 6], trainingDaysPerWeek: 4 }),
    )
    expect(result.days).toHaveLength(4)
  })

  it('produces a more conservative plan (fewer sets) under poor recovery', () => {
    const goodResult = generateWeeklyPlan(baseInput({ recovery: GOOD_RECOVERY }))
    const poorResult = generateWeeklyPlan(baseInput({ recovery: POOR_RECOVERY }))

    const totalSets = (days: typeof goodResult.days) =>
      days.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.targetSets, 0), 0)

    expect(totalSets(poorResult.days)).toBeLessThan(totalSets(goodResult.days))
    expect(poorResult.days.every((d) => d.athleticLabel === null)).toBe(true)
  })

  it('prioritizes the region with lower recent volume', () => {
    // Heavy recent upper-body work (chest exercise id 1) and no lower-body work at all.
    const recentSessions: PlannerHistorySession[] = [
      heavySession('2026-09-08', [1]),
      heavySession('2026-09-10', [1]),
      heavySession('2026-09-15', [1]),
    ]
    const result = generateWeeklyPlan(baseInput({ recentSessions, trainingDaysPerWeek: 4 }))
    expect(result.days[0].templateKey).toMatch(/^lower_/)
  })

  it('keeps generated sessions within a reasonable margin of the configured duration', () => {
    const result = generateWeeklyPlan(baseInput({ sessionDurationMinutes: 75 }))
    for (const day of result.days) {
      expect(day.estimatedDurationMinutes).toBeLessThanOrEqual(95)
      expect(day.estimatedDurationMinutes).toBeGreaterThan(20)
    }
  })

  it('includes both muscular and athletic components across the week', () => {
    const result = generateWeeklyPlan(baseInput())
    const hasMuscular = result.days.some((d) => d.exercises.length > 0)
    const hasAthletic = result.days.some((d) => d.athleticLabel !== null)
    expect(hasMuscular).toBe(true)
    expect(hasAthletic).toBe(true)
  })

  it('is deterministic: identical input produces an identical plan', () => {
    const input = baseInput({ recovery: GOOD_RECOVERY })
    const a = generateWeeklyPlan(input)
    const b = generateWeeklyPlan(input)
    expect(a).toEqual(b)
  })

  it('produces a sensible baseline plan even with no history', () => {
    const result = generateWeeklyPlan(baseInput({ recentSessions: [] }))
    expect(result.days.length).toBeGreaterThan(0)
    expect(result.basedOnLimitedHistory).toBe(true)
    expect(result.days.every((d) => d.exercises.length > 0)).toBe(true)
  })

  it('only selects exercises usable with the configured equipment access', () => {
    const result = generateWeeklyPlan(baseInput({ equipment: ['bodyweight'] }))
    const usedExerciseIds = result.days.flatMap((d) => d.exercises.map((e) => e.exerciseId))
    expect(usedExerciseIds.length).toBeGreaterThan(0)
    for (const id of usedExerciseIds) {
      const exercise = EXERCISES.find((e) => e.id === id)!
      expect(exercise.equipment === 'bodyweight' || exercise.equipment === 'none').toBe(true)
    }
  })

  it('never mutates or references historical session data (pure function of its input)', () => {
    const recentSessions = [heavySession('2026-09-15', [1, 3])]
    const snapshot = JSON.parse(JSON.stringify(recentSessions))
    generateWeeklyPlan(baseInput({ recentSessions }))
    expect(recentSessions).toEqual(snapshot)
  })
})
