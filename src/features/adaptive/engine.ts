import type { Exercise } from '../../db/types'
import { getLoadIncrementKg } from './constants'
import { classifyRecovery } from './recovery'
import { computeSessionStats } from './sessionStats'
import type {
  AdaptiveConfidence,
  AdaptiveRecommendation,
  CalculateNextTargetInput,
  ExerciseProgressionTarget,
} from './types'

/** Average RIR at/below this is treated as "no reps in reserve" (rule: RIR too low). */
const LOW_RIR_THRESHOLD = 0.5
/** Average RIR at/above this is treated as "too easy" (rule: RIR too high). */
const HIGH_RIR_THRESHOLD = 4

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function maintainResult(
  exercise: Exercise,
  currentTarget: ExerciseProgressionTarget,
  previousWeightKg: number | null,
  reason: string,
  confidence: AdaptiveConfidence,
): AdaptiveRecommendation {
  return {
    exerciseId: exercise.id!,
    action: 'maintain',
    previousTarget: currentTarget,
    nextTarget: currentTarget,
    previousWeightKg,
    recommendedWeightKg: previousWeightKg,
    reason,
    confidence,
  }
}

/**
 * Pure, deterministic rule engine. Same input always produces the same recommendation.
 * See doc/adaptive-rules.md and phase/phase-4-adaptive.md for the rules this implements.
 */
export function calculateNextExerciseTarget(input: CalculateNextTargetInput): AdaptiveRecommendation {
  const { exercise, currentTarget, recentSessions, recovery } = input
  const recoveryLevel = classifyRecovery(recovery)
  const history = recentSessions.filter((s) => s.sets.length > 0)

  if (history.length === 0) {
    return {
      exerciseId: exercise.id!,
      action: 'no_change',
      previousTarget: currentTarget,
      nextTarget: currentTarget,
      previousWeightKg: null,
      recommendedWeightKg: null,
      reason:
        'No previous sessions logged for this exercise yet. Perform it at a comfortable starting point and log your sets to build a recommendation.',
      confidence: 'limited',
    }
  }

  const previousWeightKg = history[history.length - 1].sets[0].weightKg
  const stats = history.slice(-3).map((s) => computeSessionStats(s, currentTarget.maxReps))
  const latest = stats[stats.length - 1]
  const confidenceFromEvidence: AdaptiveConfidence =
    stats.length >= 3 ? 'strong' : stats.length === 2 ? 'moderate' : 'limited'
  const increment = getLoadIncrementKg(exercise.equipment)

  // ---- Repeated decline across sessions (never react to a single bad session) ----
  const declining =
    stats.length === 3 && stats[0].avgReps > stats[1].avgReps && stats[1].avgReps > stats[2].avgReps

  const repeatedLowRir =
    stats.length >= 2 && stats.slice(-2).every((s) => s.avgRir !== null && s.avgRir <= LOW_RIR_THRESHOLD)

  if (declining || (repeatedLowRir && recoveryLevel !== 'good' && !latest.reachedUpperRepTarget)) {
    const reason = declining
      ? `Performance has declined over your last ${stats.length} sessions (avg reps ${stats
          .map((s) => round1(s.avgReps))
          .join(' → ')}). A small, conservative adjustment may help restore performance.`
      : 'RIR has stayed at or near 0 across recent sessions and recovery is not fully normal. Reducing volume may help you recover.'
    const confidence = declining ? confidenceFromEvidence : 'moderate'

    if (exercise.isBodyweight) {
      const nextTarget: ExerciseProgressionTarget = {
        ...currentTarget,
        targetSets: Math.max(2, currentTarget.targetSets - 1),
      }
      return {
        exerciseId: exercise.id!,
        action: 'reduce_volume',
        previousTarget: currentTarget,
        nextTarget,
        previousWeightKg,
        recommendedWeightKg: previousWeightKg,
        reason,
        confidence,
      }
    }

    const recommendedWeightKg = Math.max(0, round1(previousWeightKg - increment))
    return {
      exerciseId: exercise.id!,
      action: 'decrease_load',
      previousTarget: currentTarget,
      nextTarget: currentTarget,
      previousWeightKg,
      recommendedWeightKg,
      reason,
      confidence,
    }
  }

  // ---- Increase: all working sets reached the upper rep target with acceptable RIR ----
  const rirWithinIncreaseBand = latest.avgRir === null || latest.avgRir > LOW_RIR_THRESHOLD
  if (latest.reachedUpperRepTarget && rirWithinIncreaseBand) {
    if (recoveryLevel === 'poor') {
      return maintainResult(
        exercise,
        currentTarget,
        previousWeightKg,
        'You reached the top of your rep range, but recent recovery (sleep/energy/soreness) has been poor. Keeping the load the same today rather than increasing it.',
        'moderate',
      )
    }
    if (recoveryLevel === 'moderate') {
      return maintainResult(
        exercise,
        currentTarget,
        previousWeightKg,
        'You reached the top of your rep range, but recent recovery is only moderate, so the load is being held steady instead of increased.',
        'moderate',
      )
    }

    const reason = `You completed all ${latest.setCount} prescribed sets at ${currentTarget.maxReps}+ reps${
      latest.avgRir !== null ? ` with RIR around ${round1(latest.avgRir)}` : ''
    } in your last session.`

    if (exercise.isBodyweight) {
      const nextTarget: ExerciseProgressionTarget = {
        ...currentTarget,
        minReps: currentTarget.minReps + 1,
        maxReps: currentTarget.maxReps + 2,
      }
      return {
        exerciseId: exercise.id!,
        action: 'increase_load',
        previousTarget: currentTarget,
        nextTarget,
        previousWeightKg,
        recommendedWeightKg: previousWeightKg,
        reason: `${reason} Aim for more reps next time.`,
        confidence: confidenceFromEvidence,
      }
    }

    return {
      exerciseId: exercise.id!,
      action: 'increase_load',
      previousTarget: currentTarget,
      nextTarget: currentTarget,
      previousWeightKg,
      recommendedWeightKg: round1(previousWeightKg + increment),
      reason,
      confidence: confidenceFromEvidence,
    }
  }

  // ---- RIR too high across recent sessions: cautious increase even below the rep ceiling ----
  const repeatedHighRir =
    stats.length >= 2 &&
    stats.slice(-2).every((s) => s.avgRir !== null && s.avgRir >= HIGH_RIR_THRESHOLD) &&
    latest.avgReps >= currentTarget.minReps

  if (repeatedHighRir && recoveryLevel !== 'poor' && !exercise.isBodyweight) {
    return {
      exerciseId: exercise.id!,
      action: 'increase_load',
      previousTarget: currentTarget,
      nextTarget: currentTarget,
      previousWeightKg,
      recommendedWeightKg: round1(previousWeightKg + increment),
      reason:
        'Your last two sessions were completed well within your capacity (RIR 4+) even without reaching the top rep target. A small load increase is appropriate.',
      confidence: 'moderate',
    }
  }

  // ---- Maintain: normal progression, but the upper rep target isn't consistently met yet ----
  const reason =
    latest.avgRir !== null && latest.avgRir <= LOW_RIR_THRESHOLD
      ? 'Your performance is within the target range, but RIR was very low last session. Keep the current load and focus on recovery before progressing.'
      : "Your performance is within the target range but hasn't consistently reached the top of the rep range yet. Keep the current load and aim to add reps."

  return maintainResult(exercise, currentTarget, previousWeightKg, reason, confidenceFromEvidence)
}
