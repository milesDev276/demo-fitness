import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { Exercise, PlannedExercise } from '../../db/types'
import { calculateNextExerciseTarget } from './engine'
import { getLatestRecoverySignal, getRecentSessionsForExercise, targetFromPlannedExercise } from './repository'

interface RecommendationCardProps {
  exercise: Exercise
  planned: PlannedExercise
  sessionId: number
  /** The weight currently in the logger, so "Use" only shows when it differs from the suggestion. */
  currentWeightKg: number
  onApplyWeight: (weightKg: number) => void
}

/**
 * One compact "Suggested" line for the logger's info panel. The weight is pre-filled once on load, so
 * the common case is just "Log set"; "Why?" reveals the plain-language reason on demand.
 */
export function RecommendationCard({ exercise, planned, sessionId, currentWeightKg, onApplyWeight }: RecommendationCardProps) {
  const [showWhy, setShowWhy] = useState(false)

  const recommendation = useLiveQuery(async () => {
    const [recentSessions, recovery] = await Promise.all([
      getRecentSessionsForExercise(exercise.id!, sessionId),
      getLatestRecoverySignal(),
    ])
    return calculateNextExerciseTarget({
      exercise,
      currentTarget: targetFromPlannedExercise(planned),
      recentSessions,
      recovery,
    })
  }, [exercise.id, planned, sessionId])

  // Start the weight input at the recommendation once, so the common case is just "Log set".
  const appliedRef = useRef(false)
  const recommendedWeight = recommendation?.recommendedWeightKg ?? null
  useEffect(() => {
    if (appliedRef.current || recommendedWeight === null) return
    appliedRef.current = true
    onApplyWeight(recommendedWeight)
  }, [recommendedWeight, onApplyWeight])

  if (!recommendation || recommendation.action === 'no_change') return null

  const { nextTarget } = recommendation
  const reps = `${nextTarget.minReps}–${nextTarget.maxReps}`

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Suggested today</p>
      <p className="text-base font-semibold text-neutral-900 dark:text-white">
        {recommendedWeight !== null ? `${recommendedWeight}kg × ${reps} reps` : `${reps} reps`}
        <span className="ml-1.5 text-sm font-normal text-neutral-600 dark:text-neutral-400">· {nextTarget.targetSets} sets</span>
      </p>
      <div className="mt-1 flex items-center gap-4">
        {recommendedWeight !== null && recommendedWeight !== currentWeightKg && (
          <button
            type="button"
            onClick={() => onApplyWeight(recommendedWeight)}
            className="min-h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white active:bg-blue-700"
          >
            Use {recommendedWeight}kg
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          aria-expanded={showWhy}
          className="min-h-9 text-sm font-medium text-blue-700 dark:text-blue-400"
        >
          {showWhy ? 'Hide why' : 'Why?'}
        </button>
      </div>
      {showWhy && (
        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
          {recommendation.reason}
          {recommendation.confidence === 'limited' && ' (Based on limited history.)'}
        </p>
      )}
    </div>
  )
}
