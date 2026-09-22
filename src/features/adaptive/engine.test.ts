import { describe, expect, it } from 'vitest'
import type { Exercise, WorkoutSet } from '../../db/types'
import { calculateNextExerciseTarget } from './engine'
import type { ExerciseProgressionTarget, ExerciseSessionPerformance, RecoverySignal } from './types'

const BARBELL_TARGET: ExerciseProgressionTarget = {
  targetSets: 3,
  minReps: 8,
  maxReps: 10,
  targetRirMin: 1,
  targetRirMax: 3,
}

const BENCH_PRESS: Exercise = {
  id: 1,
  name: 'Barbell Bench Press',
  category: 'compound',
  equipment: 'barbell',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps'],
  movementPattern: 'push',
  isBodyweight: false,
}

const PUSH_UP: Exercise = {
  id: 2,
  name: 'Push-up',
  category: 'bodyweight',
  equipment: 'bodyweight',
  primaryMuscle: 'chest',
  secondaryMuscles: ['triceps'],
  movementPattern: 'push',
  isBodyweight: true,
}

let nextSetId = 1
function makeSet(weightKg: number, reps: number, rir?: number): WorkoutSet {
  return { id: nextSetId++, sessionId: 1, exerciseId: 1, setNumber: 1, weightKg, reps, rir }
}

function session(date: string, weightKg: number, reps: number[], rir?: number[]): ExerciseSessionPerformance {
  return { date, sets: reps.map((r, i) => makeSet(weightKg, r, rir?.[i])) }
}

const GOOD_RECOVERY: RecoverySignal = { sleepHours: 8, energy: 8, soreness: 2 }
const POOR_RECOVERY: RecoverySignal = { sleepHours: 5, energy: 3, soreness: 8 }

describe('calculateNextExerciseTarget', () => {
  it('gives a cautious baseline recommendation with no history', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [],
      recovery: null,
    })

    expect(result.action).toBe('no_change')
    expect(result.confidence).toBe('limited')
    expect(result.recommendedWeightKg).toBeNull()
  })

  it('increases load when all sets reach the upper rep range with appropriate RIR', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [session('2026-09-01', 60, [10, 10, 10], [2, 2, 1])],
      recovery: GOOD_RECOVERY,
    })

    expect(result.action).toBe('increase_load')
    expect(result.recommendedWeightKg).toBe(62.5)
    expect(result.reason).toMatch(/last session/i)
  })

  it('maintains load when performance is within range but below the rep ceiling', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [session('2026-09-01', 60, [9, 8, 8], [2, 2, 2])],
      recovery: GOOD_RECOVERY,
    })

    expect(result.action).toBe('maintain')
    expect(result.recommendedWeightKg).toBe(60)
  })

  it('reduces load conservatively after decline across three sessions', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [
        session('2026-08-01', 60, [10, 9, 9]),
        session('2026-08-08', 60, [8, 8, 7]),
        session('2026-08-15', 60, [7, 7, 6]),
      ],
      recovery: null,
    })

    expect(result.action).toBe('decrease_load')
    expect(result.recommendedWeightKg).toBe(57.5)
    expect(result.confidence).toBe('strong')
    expect(result.reason).toMatch(/declined/i)
  })

  it('does not reduce load because of a single bad session', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [session('2026-09-01', 60, [6, 5, 5], [0, 0, 0])],
      recovery: GOOD_RECOVERY,
    })

    expect(result.action).not.toBe('decrease_load')
  })

  it('does not increase load when RIR is 0 even if reps are high', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [session('2026-09-01', 60, [10, 10, 10], [0, 0, 0])],
      recovery: GOOD_RECOVERY,
    })

    expect(result.action).not.toBe('increase_load')
    expect(result.recommendedWeightKg).toBe(60)
  })

  it('does not aggressively increase load when recovery is poor, even with good performance', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [session('2026-09-01', 60, [10, 10, 10], [2, 2, 2])],
      recovery: POOR_RECOVERY,
    })

    expect(result.action).toBe('maintain')
    expect(result.recommendedWeightKg).toBe(60)
  })

  it('progresses bodyweight exercises through reps/sets, not arbitrary added weight', () => {
    const result = calculateNextExerciseTarget({
      exercise: PUSH_UP,
      currentTarget: BARBELL_TARGET,
      recentSessions: [session('2026-09-01', 0, [10, 10, 10], [2, 2, 1])],
      recovery: GOOD_RECOVERY,
    })

    expect(result.action).toBe('increase_load')
    expect(result.recommendedWeightKg).toBe(0)
    expect(result.nextTarget.maxReps).toBeGreaterThan(BARBELL_TARGET.maxReps)
  })

  it('uses a single prior session cautiously with limited confidence', () => {
    const result = calculateNextExerciseTarget({
      exercise: BENCH_PRESS,
      currentTarget: BARBELL_TARGET,
      recentSessions: [session('2026-09-01', 60, [10, 10, 10], [2, 2, 2])],
      recovery: null,
    })

    expect(result.confidence).toBe('limited')
  })
})
