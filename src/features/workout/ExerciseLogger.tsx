import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { PlannedExercise, WorkoutSet } from '../../db/types'
import { addSet, deleteSet, getPreviousPerformance, listSetsForSession, updateSet } from './repository'

interface ExerciseLoggerProps {
  sessionId: number
  planned: PlannedExercise
  onFinish: () => void
}

interface Draft {
  weight: number
  reps: number
  rir: number
}

const RIR_OPTIONS = [0, 1, 2, 3, 4]

export function ExerciseLogger({ sessionId, planned, onFinish }: ExerciseLoggerProps) {
  const exercise = useLiveQuery(() => db.exercises.get(planned.exerciseId), [planned.exerciseId])
  const sets = useLiveQuery(
    () => listSetsForSession(sessionId).then((all) => all.filter((s) => s.exerciseId === planned.exerciseId)),
    [sessionId, planned.exerciseId],
  )
  const previous = useLiveQuery(
    () => getPreviousPerformance(planned.exerciseId, sessionId),
    [planned.exerciseId, sessionId],
  )

  const [editingSetId, setEditingSetId] = useState<number | null>(null)
  const [override, setOverride] = useState<Draft | null>(null)

  const defaults: Draft = useMemo(() => {
    if (sets && sets.length > 0) {
      const last = sets[sets.length - 1]
      return { weight: last.weightKg, reps: last.reps, rir: last.rir ?? planned.targetRIR }
    }
    if (previous) {
      return { weight: previous.sets[0]?.weightKg ?? 0, reps: planned.maxReps, rir: planned.targetRIR }
    }
    return { weight: 0, reps: planned.maxReps, rir: planned.targetRIR }
  }, [sets, previous, planned.maxReps, planned.targetRIR])

  const draft = override ?? defaults

  function patchDraft(changes: Partial<Draft>) {
    setOverride({ ...draft, ...changes })
  }

  async function handleLogSet() {
    await addSet({
      sessionId,
      exerciseId: planned.exerciseId,
      weightKg: draft.weight,
      reps: draft.reps,
      rir: draft.rir,
    })
    setOverride(null)
  }

  async function handleUpdateSet() {
    if (editingSetId === null) return
    await updateSet(editingSetId, { weightKg: draft.weight, reps: draft.reps, rir: draft.rir })
    setEditingSetId(null)
    setOverride(null)
  }

  function startEdit(set: WorkoutSet) {
    setEditingSetId(set.id!)
    setOverride({ weight: set.weightKg, reps: set.reps, rir: set.rir ?? planned.targetRIR })
  }

  async function handleDelete(id: number) {
    await deleteSet(id)
    if (editingSetId === id) {
      setEditingSetId(null)
      setOverride(null)
    }
  }

  return (
    <div className="p-4 pb-28">
      <button type="button" onClick={onFinish} className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        ← Back to workout
      </button>

      <h1 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">
        {exercise?.name ?? '…'}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Target: {planned.targetSets} × {planned.minReps}–{planned.maxReps} reps · RIR {planned.targetRIR}
      </p>

      <div className="mt-3 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Last time</p>
        {previous ? (
          <>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {previous.sets[0]?.weightKg}kg
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {previous.sets.map((s) => s.reps).join(' / ')}
              {previous.sets.some((s) => s.rir !== undefined) && (
                <span className="text-neutral-400"> · RIR {previous.sets[previous.sets.length - 1]?.rir}</span>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-400">No previous data yet</p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <p className="text-[11px] uppercase text-neutral-400">Weight (kg)</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => patchDraft({ weight: Math.max(0, draft.weight - 2.5) })}
              className="h-11 w-11 rounded-full bg-neutral-100 text-xl font-semibold text-neutral-700 active:bg-neutral-200 dark:bg-neutral-800 dark:text-white"
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={draft.weight}
              onChange={(e) => patchDraft({ weight: Number(e.target.value) || 0 })}
              className="w-16 bg-transparent text-center text-2xl font-bold text-neutral-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => patchDraft({ weight: draft.weight + 2.5 })}
              className="h-11 w-11 rounded-full bg-neutral-100 text-xl font-semibold text-neutral-700 active:bg-neutral-200 dark:bg-neutral-800 dark:text-white"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 p-3 text-center dark:border-neutral-800">
          <p className="text-[11px] uppercase text-neutral-400">Reps</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => patchDraft({ reps: Math.max(0, draft.reps - 1) })}
              className="h-11 w-11 rounded-full bg-neutral-100 text-xl font-semibold text-neutral-700 active:bg-neutral-200 dark:bg-neutral-800 dark:text-white"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={draft.reps}
              onChange={(e) => patchDraft({ reps: Number(e.target.value) || 0 })}
              className="w-16 bg-transparent text-center text-2xl font-bold text-neutral-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => patchDraft({ reps: draft.reps + 1 })}
              className="h-11 w-11 rounded-full bg-neutral-100 text-xl font-semibold text-neutral-700 active:bg-neutral-200 dark:bg-neutral-800 dark:text-white"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-center text-[11px] uppercase text-neutral-400">RIR (reps in reserve)</p>
        <div className="mt-2 flex justify-center gap-2">
          {RIR_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => patchDraft({ rir: value })}
              className={`h-10 w-10 rounded-full text-sm font-semibold ${
                draft.rir === value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {editingSetId ? (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingSetId(null)
              setOverride(null)
            }}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateSet}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white active:bg-blue-700"
          >
            Save Set
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleLogSet}
          className="mt-5 w-full rounded-xl bg-neutral-900 py-4 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
        >
          Log Set
        </button>
      )}

      <div className="mt-6 space-y-2">
        {sets?.map((set) => (
          <div
            key={set.id}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
              editingSetId === set.id
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                : 'border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <button type="button" onClick={() => startEdit(set)} className="flex-1 text-left">
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Set {set.setNumber}</span>
              <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-300">
                {set.weightKg}kg × {set.reps}
                {set.rir !== undefined && <span className="text-neutral-400"> · RIR {set.rir}</span>}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(set.id!)}
              className="ml-2 h-8 w-8 shrink-0 rounded-md text-red-500"
              aria-label="Delete set"
            >
              ×
            </button>
          </div>
        ))}
        {sets && sets.length === 0 && (
          <p className="text-center text-sm text-neutral-400">No sets logged yet.</p>
        )}
      </div>
    </div>
  )
}
