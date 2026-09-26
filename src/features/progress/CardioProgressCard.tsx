import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { formatCompactDate } from '../../utils/date'
import { getSetsForExercise, listExercisesWithHistory } from './repository'

export function CardioProgressCard() {
  const exercises = useLiveQuery(
    () => listExercisesWithHistory().then((list) => list.filter((e) => e.category === 'cardio')),
    [],
  )
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const effectiveId = selectedId ?? exercises?.[0]?.exerciseId ?? null

  const history = useLiveQuery(
    () => (effectiveId !== null ? getSetsForExercise(effectiveId) : Promise.resolve([])),
    [effectiveId],
  )

  const recent = history?.slice(-5) ?? []

  // Not everyone logs cardio — don't show an empty section for it.
  if (exercises && exercises.length === 0) return null

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Cardio</h3>

      {!exercises ? null : exercises.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No cardio sessions logged yet.</p>
      ) : (
        <>
          <select
            value={effectiveId ?? ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          >
            {exercises.map((e) => (
              <option key={e.exerciseId} value={e.exerciseId}>
                {e.name}
              </option>
            ))}
          </select>

          <div className="mt-3 space-y-1">
            {recent.map((h) => (
              <div key={h.sessionId} className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
                <span>{formatCompactDate(h.date)}</span>
                <span>{h.sets.map((s) => `${s.weightKg} × ${s.reps}`).join(', ')}</span>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-neutral-500">No sessions logged yet.</p>}
          </div>

          <p className="mt-3 border-t border-neutral-100 pt-2 text-xs text-neutral-500 dark:border-neutral-900">
            Cardio is currently logged with the same weight/reps fields as strength exercises, so distance,
            duration, and pace aren't tracked yet. Structured cardio tracking is planned for a future phase.
          </p>
        </>
      )}
    </section>
  )
}
