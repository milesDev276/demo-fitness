import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Exercise, PlannedExercise, WorkoutPlan } from '../../db/types'
import { InfoTip } from '../../components/InfoTip'
import { NumberField } from '../../components/NumberField'
import { safely } from '../../utils/safely'
import { createPlan, deletePlan, updatePlan } from './repository'
import { ExercisePicker } from './ExercisePicker'

interface PlanEditorProps {
  plan: WorkoutPlan | null
  onDone: () => void
}

const DEFAULT_TARGETS = { targetSets: 3, minReps: 8, maxReps: 10, targetRIR: 2 }

export function PlanEditor({ plan, onDone }: PlanEditorProps) {
  const [name, setName] = useState(plan?.name ?? '')
  const [exercises, setExercises] = useState<PlannedExercise[]>(plan?.exercises ?? [])
  const [pickerOpen, setPickerOpen] = useState(false)

  const exerciseIds = useMemo(() => exercises.map((e) => e.exerciseId), [exercises])
  const allExercises = useLiveQuery(() => db.exercises.toArray(), [])
  const exerciseMap = useMemo(() => {
    const map = new Map<number, Exercise>()
    for (const e of allExercises ?? []) map.set(e.id!, e)
    return map
  }, [allExercises])

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [
      ...prev,
      { exerciseId: exercise.id!, order: prev.length, ...DEFAULT_TARGETS },
    ])
    setPickerOpen(false)
  }

  function removeExercise(exerciseId: number) {
    setExercises((prev) =>
      prev.filter((e) => e.exerciseId !== exerciseId).map((e, index) => ({ ...e, order: index })),
    )
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setExercises((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((e, i) => ({ ...e, order: i }))
    })
  }

  function updateTarget(exerciseId: number, changes: Partial<PlannedExercise>) {
    setExercises((prev) => prev.map((e) => (e.exerciseId === exerciseId ? { ...e, ...changes } : e)))
  }

  async function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName || exercises.length === 0) return
    const saved = await safely(() => (plan?.id ? updatePlan(plan.id, trimmedName, exercises) : createPlan(trimmedName, exercises)))
    if (saved) onDone()
  }

  async function handleDelete() {
    if (!plan?.id) return
    if (!confirm(`Delete "${plan.name}"?`)) return
    if (await safely(() => deletePlan(plan.id!), "We couldn't delete this workout. Please try again.")) onDone()
  }

  const canSave = name.trim().length > 0 && exercises.length > 0

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDone} className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Cancel
        </button>
        <h1 className="text-base font-semibold text-neutral-900 dark:text-white">
          {plan ? 'Edit Workout' : 'New Workout'}
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="text-sm font-semibold text-blue-600 disabled:text-neutral-300 dark:disabled:text-neutral-700"
        >
          Save
        </button>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workout name (e.g. Push Day)"
        className="mt-4 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
      />

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Set targets for each exercise.
        <InfoTip term="RIR">
          RIR = Reps In Reserve: how many more reps you could still do at the end of a set. 2 is a good default — hard, but not to failure.
        </InfoTip>
      </p>

      <div className="mt-4 space-y-3">
        {exercises.map((planned, index) => {
          const exercise = exerciseMap.get(planned.exerciseId)
          return (
            <div
              key={planned.exerciseId}
              className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {exercise?.name ?? 'Unknown exercise'}
                  </p>
                  <p className="text-xs capitalize text-neutral-500 dark:text-neutral-400">
                    {exercise?.primaryMuscle}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveExercise(index, -1)}
                    disabled={index === 0}
                    className="h-10 w-10 rounded-md border border-neutral-200 text-neutral-500 disabled:opacity-30 dark:border-neutral-800"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExercise(index, 1)}
                    disabled={index === exercises.length - 1}
                    className="h-10 w-10 rounded-md border border-neutral-200 text-neutral-500 disabled:opacity-30 dark:border-neutral-800"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(planned.exerciseId)}
                    className="h-10 w-10 rounded-md border border-red-200 text-red-500 dark:border-red-900"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                <NumberField compact label="Sets" min={1} max={12} value={planned.targetSets} onCommit={(targetSets) => updateTarget(planned.exerciseId, { targetSets })} />
                <NumberField compact label="Reps from" min={1} max={50} value={planned.minReps} onCommit={(minReps) => updateTarget(planned.exerciseId, { minReps, maxReps: Math.max(minReps, planned.maxReps) })} />
                <NumberField compact label="Reps to" min={1} max={50} value={planned.maxReps} onCommit={(maxReps) => updateTarget(planned.exerciseId, { maxReps, minReps: Math.min(maxReps, planned.minReps) })} />
                <NumberField compact label="RIR" min={0} max={5} value={planned.targetRIR} onCommit={(targetRIR) => updateTarget(planned.exerciseId, { targetRIR })} />
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="mt-4 w-full rounded-xl border-2 border-dashed border-neutral-300 py-3 text-sm font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
      >
        + Add Exercise
      </button>

      {plan?.id && (
        <button
          type="button"
          onClick={handleDelete}
          className="mt-8 w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-500 dark:border-red-900"
        >
          Delete Workout
        </button>
      )}

      {pickerOpen && (
        <ExercisePicker
          excludeIds={exerciseIds}
          onPick={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
