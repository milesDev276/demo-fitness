import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { WorkoutSession } from '../../db/types'
import { cancelSession, completeSession, getSessionSetsByExercise, getPlan } from './repository'
import { ExerciseLogger } from './ExerciseLogger'

interface ActiveSessionProps {
  session: WorkoutSession
  onEnded: () => void
}

export function ActiveSession({ session, onEnded }: ActiveSessionProps) {
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null)

  const plan = useLiveQuery(() => getPlan(session.planId), [session.planId])
  const setsByExercise = useLiveQuery(
    () => getSessionSetsByExercise(session.id!),
    [session.id],
  )
  const exercises = useLiveQuery(
    () => db.exercises.toArray().then((list) => new Map(list.map((e) => [e.id!, e]))),
    [],
  )

  if (activeExerciseId !== null && plan) {
    const planned = plan.exercises.find((e) => e.exerciseId === activeExerciseId)
    if (planned) {
      return (
        <ExerciseLogger
          key={activeExerciseId}
          sessionId={session.id!}
          planned={planned}
          onFinish={() => setActiveExerciseId(null)}
        />
      )
    }
  }

  async function handleComplete() {
    if (!confirm('Complete this workout?')) return
    await completeSession(session.id!)
    onEnded()
  }

  async function handleCancel() {
    if (!confirm('Cancel this workout? Logged sets will be deleted.')) return
    await cancelSession(session.id!)
    onEnded()
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{session.planName}</h1>
        <button type="button" onClick={handleCancel} className="text-sm font-medium text-red-500">
          Cancel
        </button>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Started {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>

      <div className="mt-4 space-y-2">
        {plan?.exercises
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((planned) => {
            const exercise = exercises?.get(planned.exerciseId)
            const loggedSets = setsByExercise?.get(planned.exerciseId) ?? []
            const isDone = loggedSets.length >= planned.targetSets
            return (
              <button
                key={planned.exerciseId}
                type="button"
                onClick={() => setActiveExerciseId(planned.exerciseId)}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-3 text-left dark:border-neutral-800"
              >
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {exercise?.name ?? '…'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {loggedSets.length} / {planned.targetSets} sets · {planned.minReps}–{planned.maxReps} reps
                  </p>
                </div>
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${
                    isDone ? 'bg-green-500' : loggedSets.length > 0 ? 'bg-amber-400' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              </button>
            )
          })}
      </div>

      <button
        type="button"
        onClick={handleComplete}
        className="mt-6 w-full rounded-xl bg-neutral-900 py-4 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
      >
        Complete Workout
      </button>
    </div>
  )
}
