import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { getSession, getSessionSetsByExercise } from './repository'

interface HistoryDetailProps {
  sessionId: number
  onClose: () => void
}

export function HistoryDetail({ sessionId, onClose }: HistoryDetailProps) {
  const session = useLiveQuery(() => getSession(sessionId), [sessionId])
  const setsByExercise = useLiveQuery(() => getSessionSetsByExercise(sessionId), [sessionId])
  const exercises = useLiveQuery(
    () => db.exercises.toArray().then((list) => new Map(list.map((e) => [e.id!, e]))),
    [],
  )

  if (!session || !setsByExercise) {
    return (
      <div className="p-4">
        <button type="button" onClick={onClose} className="text-sm font-medium text-neutral-500">
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <button type="button" onClick={onClose} className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        ← Back
      </button>
      <h1 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">{session.planName}</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {session.date}
        {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
      </p>

      <div className="mt-4 space-y-4">
        {Array.from(setsByExercise.entries()).map(([exerciseId, sets]) => (
          <div key={exerciseId} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <p className="font-medium text-neutral-900 dark:text-white">
              {exercises?.get(exerciseId)?.name ?? '…'}
            </p>
            <ul className="mt-1 space-y-0.5">
              {sets.map((set) => (
                <li key={set.id} className="text-sm text-neutral-600 dark:text-neutral-300">
                  Set {set.setNumber}: {set.weightKg}kg × {set.reps}
                  {set.rir !== undefined && <span className="text-neutral-400"> · RIR {set.rir}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
