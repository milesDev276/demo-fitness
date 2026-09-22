import type { Exercise, WorkoutSet } from '../../db/types'

/** Reusable progression target, independent of the plan's single-number RIR field. */
export interface ExerciseProgressionTarget {
  targetSets: number
  minReps: number
  maxReps: number
  targetRirMin: number
  targetRirMax: number
}

export type AdaptiveAction = 'increase_load' | 'maintain' | 'decrease_load' | 'reduce_volume' | 'no_change'

export type AdaptiveConfidence = 'strong' | 'moderate' | 'limited'

export interface AdaptiveRecommendation {
  exerciseId: number
  action: AdaptiveAction
  previousTarget: ExerciseProgressionTarget
  nextTarget: ExerciseProgressionTarget
  previousWeightKg: number | null
  recommendedWeightKg: number | null
  reason: string
  confidence: AdaptiveConfidence
}

export interface ExerciseSessionPerformance {
  date: string
  sets: WorkoutSet[]
}

export interface RecoverySignal {
  sleepHours?: number
  energy?: number
  soreness?: number
}

export type RecoveryLevel = 'good' | 'moderate' | 'poor' | 'unknown'

export interface CalculateNextTargetInput {
  exercise: Exercise
  currentTarget: ExerciseProgressionTarget
  /** Completed sessions for this exercise, ascending by date, most recent last. */
  recentSessions: ExerciseSessionPerformance[]
  recovery: RecoverySignal | null
}
