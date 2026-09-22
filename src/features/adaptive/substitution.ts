import type { Exercise } from '../../db/types'

export interface SubstitutionResult {
  substitute: Exercise | null
  reason: string
}

/**
 * Basic substitution: preserves movement pattern and primary muscle, preferring a candidate
 * with different equipment (the common reason to substitute — equipment unavailable).
 * Never invents an exercise; returns null when nothing in the library matches.
 */
export function findSubstituteExercise(exercise: Exercise, allExercises: Exercise[]): SubstitutionResult {
  const candidates = allExercises.filter(
    (e) =>
      e.id !== exercise.id &&
      e.movementPattern === exercise.movementPattern &&
      e.primaryMuscle === exercise.primaryMuscle,
  )

  if (candidates.length === 0) {
    return { substitute: null, reason: 'No substitution available.' }
  }

  const substitute = candidates.find((e) => e.equipment !== exercise.equipment) ?? candidates[0]

  return {
    substitute,
    reason: `${substitute.name} targets the same ${exercise.primaryMuscle} with the same ${exercise.movementPattern} movement pattern.`,
  }
}
