import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Exercise } from '../../db/types'

interface ExercisePickerProps {
  excludeIds: number[]
  onPick: (exercise: Exercise) => void
  onClose: () => void
}

export function ExercisePicker({ excludeIds, onPick, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])

  const filtered = useMemo(() => {
    if (!exercises) return []
    const q = query.trim().toLowerCase()
    return exercises.filter((e) => {
      if (excludeIds.includes(e.id!)) return false
      if (!q) return true
      return e.name.toLowerCase().includes(q) || e.primaryMuscle.toLowerCase().includes(q)
    })
  }, [exercises, query, excludeIds])

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white dark:bg-neutral-950">
      <div className="flex items-center gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-neutral-500 dark:text-neutral-400"
        >
          Cancel
        </button>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises or muscle…"
          className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        />
      </div>
      <ul className="flex-1 overflow-y-auto">
        {filtered.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              onClick={() => onPick(exercise)}
              className="flex w-full flex-col items-start gap-0.5 border-b border-neutral-100 px-4 py-3 text-left active:bg-neutral-100 dark:border-neutral-900 dark:active:bg-neutral-900"
            >
              <span className="text-base font-medium text-neutral-900 dark:text-white">{exercise.name}</span>
              <span className="text-xs capitalize text-neutral-500 dark:text-neutral-400">
                {exercise.primaryMuscle} · {exercise.equipment}
              </span>
            </button>
          </li>
        ))}
        {exercises && filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-neutral-400">No exercises found.</li>
        )}
      </ul>
    </div>
  )
}
