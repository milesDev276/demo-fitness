import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { WorkoutSession } from '../../db/types'
import { safely } from '../../utils/safely'
import {
  completeSession,
  getSession,
  getSessionSetsByExercise,
  getSessionSummary,
  getPlan,
  type SessionSummary,
} from './repository'
import { ExerciseLogger } from './ExerciseLogger'
import { RestTimer } from './RestTimer'
import { ResetWorkoutMenu } from './ResetWorkoutMenu'

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
  // The rest timer lives here (not in the logger) so it keeps running while you move between exercises.
  const [rest, setRest] = useState<{ token: number; seconds: number } | null>(null)

  const plan = useLiveQuery(() => getPlan(session.planId), [session.planId])
  const setsByExercise = useLiveQuery(() => getSessionSetsByExercise(session.id!), [session.id])
  const exercises = useLiveQuery(
    () => db.exercises.toArray().then((list) => new Map(list.map((e) => [e.id!, e]))),
    [],
  )

  const ordered = plan?.exercises.slice().sort((a, b) => a.order - b.order) ?? []
  const isExerciseDone = (exerciseId: number, targetSets: number) =>
    (setsByExercise?.get(exerciseId)?.length ?? 0) >= targetSets
  const firstUnfinished = ordered.find((p) => !isExerciseDone(p.exerciseId, p.targetSets))
  const totalLogged = Array.from(setsByExercise?.values() ?? []).reduce((sum, list) => sum + list.length, 0)

  async function handleComplete() {
    if (totalLogged === 0 && !confirm('You haven’t logged any sets. Finish this workout anyway?')) return
    await safely(async () => {
      await completeSession(session.id!)
      const [updated, summary] = await Promise.all([getSession(session.id!), getSessionSummary(session.id!)])
      setRest(null)
      setCompletion({ durationMinutes: updated?.durationMinutes ?? 0, summary })
    }, "We couldn't finish this workout. Please try again.")
  }

  const restBar = rest && !completion && (
    <RestTimer key={rest.token} seconds={rest.seconds} onDone={() => setRest(null)} />
  )

  if (completion) {
    return (
      <div className="flex flex-col items-center p-4 pb-24 text-center">
        <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-neutral-500">Workout Complete</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">{session.planName}</h1>

        <div className="mt-8 flex w-full max-w-xs justify-between">
          <CompletionStat label="Duration" value={`${completion.durationMinutes} min`} />
          <CompletionStat label="Exercises" value={String(completion.summary.exerciseCount)} />
          <CompletionStat label="Sets" value={String(completion.summary.setCount)} />
        </div>

        {completion.summary.volumeKg > 0 && (
          <div className="mt-8">
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{completion.summary.volumeKg} kg</p>
            <p className="mt-1 text-xs uppercase text-neutral-500">Total Volume</p>
          </div>
        )}

        <button
          type="button"
          onClick={onEnded}
          className="mt-10 min-h-14 w-full max-w-xs rounded-xl bg-neutral-900 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
        >
          Finish
        </button>
        <p className="mt-3 text-sm text-neutral-500">Next up on Today: log recovery and nutrition.</p>
      </div>
    )
  }

  if (activeExerciseId !== null && plan) {
    const index = ordered.findIndex((e) => e.exerciseId === activeExerciseId)
    const planned = ordered[index]
    if (planned) {
      // The next exercise that still needs sets — looking forward first, then wrapping to any skipped one.
      const candidates = [...ordered.slice(index + 1), ...ordered.slice(0, index)]
      const nextPlanned = candidates.find((p) => !isExerciseDone(p.exerciseId, p.targetSets))
      const nextExercise = nextPlanned
        ? { id: nextPlanned.exerciseId, name: exercises?.get(nextPlanned.exerciseId)?.name ?? 'Next exercise' }
        : null
      return (
        <>
          {restBar}
          <ExerciseLogger
            key={activeExerciseId}
            sessionId={session.id!}
            planned={planned}
            nextExercise={nextExercise}
            onNext={() => setActiveExerciseId(nextExercise ? nextExercise.id : null)}
            onFinish={() => setActiveExerciseId(null)}
            onSetLogged={(seconds) => setRest((r) => ({ token: (r?.token ?? 0) + 1, seconds }))}
          />
        </>
      )
    }
  }

  return (
    <>
      {restBar}
      <div className="p-4 pb-24">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{session.planName}</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Started {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · pick an exercise to log
            </p>
          </div>
          {/* Tucked into a menu, away from the Complete button, and always behind a confirmation. */}
          <ResetWorkoutMenu sessionId={session.id!} onReset={onEnded} />
        </div>

        {exercises && !plan && (
          <p className="mt-6 text-center text-sm text-neutral-500">
            This workout’s plan is no longer available. You can still complete or reset this session.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {ordered.map((planned) => {
            const exercise = exercises?.get(planned.exerciseId)
            const logged = setsByExercise?.get(planned.exerciseId)?.length ?? 0
            const done = logged >= planned.targetSets
            const isNext = firstUnfinished?.exerciseId === planned.exerciseId
            return (
              <button
                key={planned.exerciseId}
                type="button"
                onClick={() => setActiveExerciseId(planned.exerciseId)}
                className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left ${
                  isNext
                    ? 'border-neutral-900 bg-white dark:border-white dark:bg-neutral-900'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <p className={`font-medium ${done ? 'text-neutral-500 line-through' : 'text-neutral-900 dark:text-white'}`}>
                    {exercise?.name ?? '…'}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {planned.targetSets} × {planned.minReps}–{planned.maxReps} reps
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    done
                      ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
                      : isNext
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : logged > 0
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {done ? '✓ Done' : isNext && logged === 0 ? 'Up next' : `${logged}/${planned.targetSets}`}
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleComplete}
          className={`mt-6 min-h-14 w-full rounded-xl text-base font-semibold ${
            firstUnfinished
              ? 'border border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300'
              : 'bg-neutral-900 text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900'
          }`}
        >
          {firstUnfinished ? 'Finish Workout Early' : 'Complete Workout'}
        </button>
      </div>
    </>
  )
}

function CompletionStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-xs uppercase text-neutral-500">{label}</p>
    </div>
  )
}
