import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { summarizeSets } from '../calendar/calendar'
import { getSessionSetsByExercise } from './repository'

/** The exercises and sets performed in one completed session, one compact line per exercise. */
export function SessionExercises({ sessionId }: { sessionId: number }) {
  const setsByExercise = useLiveQuery(() => getSessionSetsByExercise(sessionId), [sessionId])
  const exercises = useLiveQuery(
    () => db.exercises.toArray().then((list) => new Map(list.map((e) => [e.id!, e.name]))),
    [],
  )

  if (!setsByExercise) return null
  if (setsByExercise.size === 0) return <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">No sets were logged.</p>

  return (
    <ul className="mt-3 space-y-2">
      {Array.from(setsByExercise.entries()).map(([exerciseId, sets]) => (
        <li key={exerciseId}>
          <p className="font-medium text-neutral-900 dark:text-white">{exercises?.get(exerciseId) ?? '…'}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{summarizeSets(sets)}</p>
        </li>
      ))}
    </ul>
  )
}
