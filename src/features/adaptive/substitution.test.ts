import { describe, expect, it } from 'vitest'
import type { Exercise } from '../../db/types'
import { findSubstituteExercise } from './substitution'

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

const DB_BENCH_PRESS: Exercise = {
  id: 2,
  name: 'Incline Dumbbell Press',
  category: 'compound',
  equipment: 'dumbbell',
  primaryMuscle: 'chest',
  secondaryMuscles: ['shoulders'],
  movementPattern: 'push',
  isBodyweight: false,
}

const CALF_RAISE: Exercise = {
  id: 3,
  name: 'Calf Raise',
  category: 'isolation',
  equipment: 'machine',
  primaryMuscle: 'calves',
  secondaryMuscles: [],
  movementPattern: 'squat',
  isBodyweight: false,
}

describe('findSubstituteExercise', () => {
  it('finds a substitute with the same movement pattern and primary muscle', () => {
    const result = findSubstituteExercise(BENCH_PRESS, [BENCH_PRESS, DB_BENCH_PRESS, CALF_RAISE])
    expect(result.substitute?.id).toBe(DB_BENCH_PRESS.id)
  })

  it('returns no substitution when nothing matches', () => {
    const result = findSubstituteExercise(CALF_RAISE, [BENCH_PRESS, DB_BENCH_PRESS, CALF_RAISE])
    expect(result.substitute).toBeNull()
    expect(result.reason).toBe('No substitution available.')
  })
})
