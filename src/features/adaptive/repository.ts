import { db } from '../../db/db'
import type { PlannedExercise } from '../../db/types'
import { getSetsForExercise } from '../progress/repository'
import { DEFAULT_PROGRESSION_TARGET } from './constants'
import type { ExerciseProgressionTarget, ExerciseSessionPerformance, RecoverySignal } from './types'

/** Builds the current target from the plan's PlannedExercise; a single RIR becomes a small band. */
export function targetFromPlannedExercise(planned: PlannedExercise | null | undefined): ExerciseProgressionTarget {
  if (!planned) return DEFAULT_PROGRESSION_TARGET
  return {
    targetSets: planned.targetSets,
    minReps: planned.minReps,
    maxReps: planned.maxReps,
    targetRirMin: Math.max(0, planned.targetRIR - 1),
    targetRirMax: planned.targetRIR + 1,
  }
}

/** Last few completed sessions for this exercise, ascending by date, excluding the current session. */
export async function getRecentSessionsForExercise(
  exerciseId: number,
  excludeSessionId?: number,
  limit = 3,
): Promise<ExerciseSessionPerformance[]> {
  const history = await getSetsForExercise(exerciseId)
  const filtered = excludeSessionId ? history.filter((h) => h.sessionId !== excludeSessionId) : history
  return filtered.slice(-limit).map((h) => ({ date: h.date, sets: h.sets }))
}

/** Most recently logged check-in (workouts are usually started before today's recovery is logged). */
export async function getLatestRecoverySignal(): Promise<RecoverySignal | null> {
  const [latest] = await db.dailyCheckIns.orderBy('date').reverse().limit(1).toArray()
  if (!latest) return null
  const { sleepHours, energy, soreness } = latest
  if (sleepHours === undefined && energy === undefined && soreness === undefined) return null
  return { sleepHours, energy, soreness }
}
