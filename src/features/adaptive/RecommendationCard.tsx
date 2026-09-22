import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { Exercise, PlannedExercise } from '../../db/types'
import { calculateNextExerciseTarget } from './engine'
import { getLatestRecoverySignal, getRecentSessionsForExercise, targetFromPlannedExercise } from './repository'
import type { AdaptiveAction } from './types'

interface RecommendationCardProps {
  exercise: Exercise
  planned: PlannedExercise
  sessionId: number
  onApplyWeight: (weightKg: number) => void
}

const ACTION_LABEL: Record<AdaptiveAction, string> = {
  increase_load: 'Increase',
  maintain: 'Maintain',
  decrease_load: 'Reduce load',
  reduce_volume: 'Reduce volume',
  no_change: 'No recommendation yet',
}

export function RecommendationCard({ exercise, planned, sessionId, onApplyWeight }: RecommendationCardProps) {
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

  if (!recommendation || recommendation.action === 'no_change') return null

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
          Recommended · {ACTION_LABEL[recommendation.action]}
        </p>
        <span className="text-[10px] uppercase text-blue-400">{recommendation.confidence} evidence</span>
      </div>

      <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
        {recommendation.recommendedWeightKg !== null
          ? `${recommendation.recommendedWeightKg}kg × ${recommendation.nextTarget.minReps}–${recommendation.nextTarget.maxReps}`
          : `${recommendation.nextTarget.minReps}–${recommendation.nextTarget.maxReps} reps`}
        <span className="ml-2 text-sm font-normal text-neutral-500">· {recommendation.nextTarget.targetSets} sets</span>
      </p>

      <div className="mt-2 flex items-center gap-3">
        {recommendation.recommendedWeightKg !== null && (
          <button
            type="button"
            onClick={() => onApplyWeight(recommendation.recommendedWeightKg!)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-blue-700"
          >
            Use {recommendation.recommendedWeightKg}kg
          </button>
        )}
        <button type="button" onClick={() => setShowWhy((v) => !v)} className="text-xs font-medium text-blue-500">
          {showWhy ? 'Hide why' : 'Why?'}
        </button>
      </div>

      {showWhy && <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">{recommendation.reason}</p>}
    </div>
  )
}
