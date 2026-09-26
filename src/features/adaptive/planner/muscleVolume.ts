import type { Exercise } from '../../../db/types'
import type { PlannerHistorySession, TrainingRegion } from './types'

const UPPER_MUSCLES = new Set(['chest', 'back', 'shoulders', 'biceps', 'triceps'])
const LOWER_MUSCLES = new Set(['quads', 'hamstrings', 'glutes', 'calves'])

/** Core/cardio/mobility muscles are intentionally excluded — they don't count toward the upper/lower split. */
export function regionOfMuscle(muscle: string): TrainingRegion | null {
  if (UPPER_MUSCLES.has(muscle)) return 'upper'
  if (LOWER_MUSCLES.has(muscle)) return 'lower'
  return null
}

export interface RegionVolume {
  upper: number
  lower: number
}

/** Counts logged sets per region over the given history — a practical proxy for recent volume (doc #9). */
export function computeRecentRegionVolume(
  recentSessions: PlannerHistorySession[],
  exercisesById: Map<number, Exercise>,
): RegionVolume {
  const volume: RegionVolume = { upper: 0, lower: 0 }
  for (const session of recentSessions) {
    for (const set of session.sets) {
      const exercise = exercisesById.get(set.exerciseId)
      if (!exercise) continue
      const region = regionOfMuscle(exercise.primaryMuscle)
      if (region === 'upper') volume.upper += 1
      else if (region === 'lower') volume.lower += 1
    }
  }
  return volume
}

/** Region that should be prioritized next — the one with LESS recent volume. Ties favor upper. */
export function needierRegion(volume: RegionVolume): 'upper' | 'lower' {
  return volume.upper <= volume.lower ? 'upper' : 'lower'
}
