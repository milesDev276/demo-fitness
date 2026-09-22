import type { ExerciseProgressionTarget } from './types'

/** Matches PlanEditor's own defaults (3 sets, 8-10 reps, RIR ~2). */
export const DEFAULT_PROGRESSION_TARGET: ExerciseProgressionTarget = {
  targetSets: 3,
  minReps: 8,
  maxReps: 10,
  targetRirMin: 1,
  targetRirMax: 3,
}

const EQUIPMENT_INCREMENTS_KG: Record<string, number> = {
  barbell: 2.5,
  dumbbell: 2,
  machine: 5,
  cable: 5,
  kettlebell: 4,
}

const DEFAULT_INCREMENT_KG = 2.5

export function getLoadIncrementKg(equipment: string): number {
  return EQUIPMENT_INCREMENTS_KG[equipment] ?? DEFAULT_INCREMENT_KG
}
