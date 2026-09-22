import { useLiveQuery } from 'dexie-react-hooks'
import type { WorkoutPlan } from '../../db/types'
import { listPlans, startSession } from './repository'

interface PlanListProps {
  onSessionStarted: (sessionId: number) => void
  onCreatePlan: () => void
  onEditPlan: (plan: WorkoutPlan) => void
  onOpenHistory: () => void
}

export function PlanList({ onSessionStarted, onCreatePlan, onEditPlan, onOpenHistory }: PlanListProps) {
  const plans = useLiveQuery(() => listPlans(), [])

  async function handleStart(plan: WorkoutPlan) {
    const sessionId = await startSession(plan)
    onSessionStarted(sessionId)
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Workout</h1>
        <button type="button" onClick={onOpenHistory} className="text-sm font-medium text-blue-600">
          History
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {plans?.map((plan) => (
          <div
            key={plan.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <button type="button" onClick={() => onEditPlan(plan)} className="text-left">
              <p className="font-medium text-neutral-900 dark:text-white">{plan.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {plan.exercises.length} exercise{plan.exercises.length === 1 ? '' : 's'}
              </p>
            </button>
            <button
              type="button"
              onClick={() => handleStart(plan)}
              className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              Start
            </button>
          </div>
        ))}
        {plans && plans.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-400">
            No workouts yet. Create one to get started.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onCreatePlan}
        className="mt-4 w-full rounded-xl border-2 border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
      >
        + New Workout
      </button>
    </div>
  )
}
