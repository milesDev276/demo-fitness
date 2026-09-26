import { useLiveQuery } from 'dexie-react-hooks'
import type { WorkoutPlan } from '../../db/types'
import { safely } from '../../utils/safely'
import { formatShortDate } from '../../utils/date'
import { listManualPlans, listScheduledPlans, startSession, type ScheduleStatus } from './repository'

interface PlanListProps {
  onSessionStarted: (sessionId: number) => void
  onCreatePlan: () => void
  onEditPlan: (plan: WorkoutPlan) => void
  onBack: () => void
  onPlanWeek: () => void
}

const STATUS_LABEL: Record<ScheduleStatus, string> = { today: 'Today', upcoming: '', missed: 'Missed', done: '✓ Done' }

export function PlanList({ onSessionStarted, onCreatePlan, onEditPlan, onBack, onPlanWeek }: PlanListProps) {
  const scheduled = useLiveQuery(() => listScheduledPlans(), [])
  const manual = useLiveQuery(() => listManualPlans(), [])

  async function handleStart(plan: WorkoutPlan) {
    let sessionId: number | undefined
    await safely(async () => {
      sessionId = await startSession(plan)
    }, "We couldn't start this workout. Please try again.")
    if (sessionId !== undefined) onSessionStarted(sessionId)
  }

  return (
    <div className="p-4 pb-24">
      <button type="button" onClick={onBack} className="-ml-1 min-h-10 px-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        ← Back
      </button>
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Choose a Workout</h1>

      {scheduled && scheduled.length === 0 ? (
        <section className="mt-4 rounded-xl bg-neutral-900 p-5 text-white dark:bg-neutral-800">
          <h2 className="text-lg font-semibold">Plan your training week</h2>
          <p className="mt-1 text-sm text-neutral-300">FitFlow picks the days and exercises from your settings. You review it before anything is saved.</p>
          <button
            type="button"
            onClick={onPlanWeek}
            className="mt-4 min-h-12 w-full rounded-xl bg-white text-base font-semibold text-neutral-900 active:bg-neutral-200"
          >
            Plan My Week
          </button>
        </section>
      ) : (
        <section className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Planned</h2>
            <button type="button" onClick={onPlanWeek} className="min-h-10 px-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              Re-plan
            </button>
          </div>
          <div className="space-y-2">
            {scheduled?.map(({ plan, status }) => (
              <div
                key={plan.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                  status === 'today' ? 'border-neutral-900 dark:border-white' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <button type="button" onClick={() => onEditPlan(plan)} className="min-h-12 flex-1 text-left" aria-label={`Edit ${plan.name}`}>
                  <p className={`font-medium ${status === 'done' ? 'text-neutral-500' : 'text-neutral-900 dark:text-white'}`}>{plan.name}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {STATUS_LABEL[status] ? <span className="font-semibold">{STATUS_LABEL[status]} · </span> : null}
                    {formatShortDate(plan.scheduledDate!)}
                    {plan.estimatedDurationMinutes ? ` · ~${plan.estimatedDurationMinutes} min` : ''}
                  </p>
                </button>
                {status !== 'done' && (
                  <button
                    type="button"
                    onClick={() => handleStart(plan)}
                    className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold ${
                      status === 'upcoming'
                        ? 'border border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300'
                        : 'bg-neutral-900 text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900'
                    }`}
                  >
                    Start
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">My workouts</h2>
        <div className="mt-1 space-y-2">
          {manual?.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <button type="button" onClick={() => onEditPlan(plan)} className="min-h-12 flex-1 text-left" aria-label={`Edit ${plan.name}`}>
                <p className="font-medium text-neutral-900 dark:text-white">{plan.name}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {plan.exercises.length} exercise{plan.exercises.length === 1 ? '' : 's'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => handleStart(plan)}
                className="min-h-11 shrink-0 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                Start
              </button>
            </div>
          ))}
          {manual && manual.length === 0 && (
            <p className="py-2 text-sm text-neutral-500">Build your own routine if you prefer — it will show up here.</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCreatePlan}
          className="mt-3 min-h-12 w-full rounded-xl border-2 border-dashed border-neutral-300 text-sm font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
        >
          + New Workout
        </button>
      </section>
    </div>
  )
}
