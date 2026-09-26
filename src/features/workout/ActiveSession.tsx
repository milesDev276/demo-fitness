import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { safely } from '../../utils/safely'
import type { WorkoutSession } from '../../db/types'
import {
  cancelSession,
  completeSession,
  getSession,
  getSessionSetsByExercise,
  getSessionSummary,
  getPlan,
  type SessionSummary,
} from './repository'
import { ExerciseLogger } from './ExerciseLogger'

interface ActiveSessionProps {
  session: WorkoutSession
  onEnded: () => void
}

interface CompletionInfo {
  durationMinutes: number
  summary: SessionSummary
}

export function ActiveSession({ session, onEnded }: ActiveSessionProps) {
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null)
  const [completion, setCompletion] = useState<CompletionInfo | null>(null)

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
    await safely(async () => {
      await completeSession(session.id!)
      const [updated, summary] = await Promise.all([getSession(session.id!), getSessionSummary(session.id!)])
      setCompletion({ durationMinutes: updated?.durationMinutes ?? 0, summary })
    }, "We couldn't finish this workout. Please try again.")
  }

  async function handleCancel() {
    if (!confirm('Cancel this workout? Logged sets will be deleted.')) return
    if (await safely(() => cancelSession(session.id!), "We couldn't cancel this workout. Please try again.")) onEnded()
  }

  if (completion) {
    return (
      <div className="flex flex-col items-center p-4 pb-24 text-center">
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Workout Complete</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">{session.planName}</h1>

        <div className="mt-8 flex w-full max-w-xs justify-between">
          <CompletionStat label="Duration" value={`${completion.durationMinutes} min`} />
          <CompletionStat label="Exercises" value={String(completion.summary.exerciseCount)} />
          <CompletionStat label="Sets" value={String(completion.summary.setCount)} />
        </div>

        <div className="mt-8">
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">{completion.summary.volumeKg} kg</p>
          <p className="mt-1 text-[11px] uppercase text-neutral-400">Total Volume</p>
        </div>

        <button
          type="button"
          onClick={onEnded}
          className="mt-10 w-full max-w-xs rounded-xl bg-neutral-900 py-4 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
        >
          Finish
        </button>
      </div>
    )
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

      {exercises && !plan && (
        <p className="mt-6 text-center text-sm text-neutral-400">
          This workout's plan is no longer available. You can still complete or cancel this session.
        </p>
      )}

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

function CompletionStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-[11px] uppercase text-neutral-400">{label}</p>
    </div>
  )
}
