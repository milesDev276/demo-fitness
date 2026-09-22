import { useEffect, useState } from 'react'
import { db } from '../db/db'

export function WorkoutPage() {
  const [exerciseCount, setExerciseCount] = useState<number | null>(null)

  useEffect(() => {
    db.exercises.count().then(setExerciseCount)
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Workout</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Workout logging will appear here.
      </p>
      <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
        {exerciseCount === null ? 'Loading exercise library…' : `${exerciseCount} exercises loaded in the local database.`}
      </p>
    </div>
  )
}
