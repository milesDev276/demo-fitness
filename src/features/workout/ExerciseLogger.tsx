import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { PlannedExercise, WorkoutSet } from '../../db/types'
import { InfoTip } from '../../components/InfoTip'
import { formatShortDate } from '../../utils/date'
import { formatSet } from '../../utils/format'
import { safely } from '../../utils/safely'
import { addSet, deleteSet, getPreviousPerformance, listSetsForSession, updateSet } from './repository'
import { RecommendationCard } from '../adaptive'
import { restSecondsFor } from './restDuration'

interface ExerciseLoggerProps {
  sessionId: number
  planned: PlannedExercise
  /** The next exercise still to do, if any — powers the "Next" button once this one is finished. */
  nextExercise: { id: number; name: string } | null
  onNext: () => void
  onFinish: () => void
  /** Called after a set is logged, with how long to rest. */
  onSetLogged: (restSeconds: number) => void
}

interface Draft {
  weight: number
  reps: number
  rir: number
}

const RIR_OPTIONS = [0, 1, 2, 3, 4]
/** Barbell/machine/cable stacks move in 2.5 kg jumps; dumbbells and the rest in 1 kg. */
const BIG_STEP_EQUIPMENT = ['barbell', 'machine', 'cable']

const STEPPER =
  'h-12 w-12 shrink-0 rounded-full bg-neutral-100 text-2xl font-semibold text-neutral-700 active:bg-neutral-200 dark:bg-neutral-800 dark:text-white'
const NUMBER_INPUT = 'w-20 bg-transparent text-center text-3xl font-bold text-neutral-900 dark:text-white'

export function ExerciseLogger({ sessionId, planned, nextExercise, onNext, onFinish, onSetLogged }: ExerciseLoggerProps) {
  const exercise = useLiveQuery(() => db.exercises.get(planned.exerciseId), [planned.exerciseId])
  const sets = useLiveQuery(
    () => listSetsForSession(sessionId).then((all) => all.filter((s) => s.exerciseId === planned.exerciseId)),
    [sessionId, planned.exerciseId],
  )
  const previous = useLiveQuery(
    () => getPreviousPerformance(planned.exerciseId, sessionId).then((p) => p ?? null),
    [planned.exerciseId, sessionId],
  )

  const [editingSetId, setEditingSetId] = useState<number | null>(null)
  const [override, setOverride] = useState<Draft | null>(null)
  const [addingExtra, setAddingExtra] = useState(false)

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

  const defaultsRef = useRef(defaults)
  useEffect(() => {
    defaultsRef.current = defaults
  }, [defaults])

  const draft = override ?? defaults

  function patchDraft(changes: Partial<Draft>) {
    setOverride({ ...draft, ...changes })
  }

  // Functional update + stable identity, so the suggestion can pre-fill its weight once on mount.
  const applyWeight = useCallback(
    (weight: number) => setOverride((current) => ({ ...(current ?? defaultsRef.current), weight })),
    [],
  )

  const step = BIG_STEP_EQUIPMENT.includes(exercise?.equipment ?? '') ? 2.5 : 1
  const loggedCount = sets?.length ?? 0
  const allDone = loggedCount >= planned.targetSets

  async function handleLogSet() {
    const saved = await safely(() =>
      addSet({
        sessionId,
        exerciseId: planned.exerciseId,
        weightKg: draft.weight,
        reps: draft.reps,
        rir: draft.rir,
      }),
    )
    if (!saved) return
    setOverride(null)
    setAddingExtra(false)
    onSetLogged(restSecondsFor(exercise?.category))
  }

  async function handleUpdateSet() {
    if (editingSetId === null) return
    const saved = await safely(() => updateSet(editingSetId, { weightKg: draft.weight, reps: draft.reps, rir: draft.rir }))
    if (!saved) return
    setEditingSetId(null)
    setOverride(null)
  }

  async function handleDeleteEditing() {
    if (editingSetId === null) return
    if (!confirm('Delete this set?')) return
    if (!(await safely(() => deleteSet(editingSetId), "We couldn't delete this set. Please try again."))) return
    setEditingSetId(null)
    setOverride(null)
  }

  function startEdit(set: WorkoutSet) {
    setEditingSetId(set.id!)
    setOverride({ weight: set.weightKg, reps: set.reps, rir: set.rir ?? planned.targetRIR })
  }

  function cancelEdit() {
    setEditingSetId(null)
    setOverride(null)
  }

  return (
    <div className="p-4 pb-4">
      <button type="button" onClick={onFinish} className="-ml-1 min-h-10 px-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        ← All exercises
      </button>

      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">{exercise?.name ?? '…'}</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Target: {planned.targetSets} sets × {planned.minReps}–{planned.maxReps} reps · RIR {planned.targetRIR}
        <InfoTip term="RIR">
          Reps In Reserve — how many more reps you could still have done. RIR 2 means you stopped with 2 left in the tank.
        </InfoTip>
      </p>

      <div className="mt-3 space-y-3 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Last time{previous ? ` · ${formatShortDate(previous.date)}` : ''}
          </p>
          {previous ? (
            <p className="text-base font-semibold text-neutral-900 dark:text-white">
              {previous.sets[0]?.weightKg > 0 ? `${previous.sets[0].weightKg}kg × ` : ''}
              {previous.sets.map((s) => s.reps).join(' · ')}
              {previous.sets.some((s) => s.rir !== undefined) && (
                <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                  {' '}
                  · RIR {previous.sets[previous.sets.length - 1]?.rir}
                </span>
              )}
            </p>
          ) : previous === null ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              First time — pick a weight you could lift {planned.maxReps}+ times with about {planned.targetRIR} reps to spare.
            </p>
          ) : null}
        </div>

        {exercise && (
          <div className="empty:hidden">
            <RecommendationCard
              exercise={exercise}
              planned={planned}
              sessionId={sessionId}
              currentWeightKg={draft.weight}
              onApplyWeight={applyWeight}
            />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-xs uppercase text-neutral-500">Weight (kg)</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => patchDraft({ weight: Math.max(0, draft.weight - step) })}
              aria-label="Decrease weight"
              className={STEPPER}
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={draft.weight}
              aria-label="Weight in kilograms"
              onFocus={(e) => e.target.select()}
              onChange={(e) => patchDraft({ weight: Number(e.target.value) || 0 })}
              className={NUMBER_INPUT}
            />
            <button type="button" onClick={() => patchDraft({ weight: draft.weight + step })} aria-label="Increase weight" className={STEPPER}>
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-xs uppercase text-neutral-500">Reps</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => patchDraft({ reps: Math.max(0, draft.reps - 1) })}
              aria-label="Decrease reps"
              className={STEPPER}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={draft.reps}
              aria-label="Reps"
              onFocus={(e) => e.target.select()}
              onChange={(e) => patchDraft({ reps: Number(e.target.value) || 0 })}
              className={NUMBER_INPUT}
            />
            <button type="button" onClick={() => patchDraft({ reps: draft.reps + 1 })} aria-label="Increase reps" className={STEPPER}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-center text-xs uppercase text-neutral-500">
          RIR · reps left in the tank
        </p>
        <div role="group" aria-label="Reps in reserve" className="mt-2 grid grid-cols-5 gap-2">
          {RIR_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => patchDraft({ rir: value })}
              aria-pressed={draft.rir === value}
              aria-label={`RIR ${value}`}
              className={`h-12 rounded-lg text-lg font-semibold ${
                draft.rir === value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Logged {loggedCount} of {planned.targetSets}
        </p>
        <div className="mt-2 space-y-2">
          {sets?.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => startEdit(set)}
              aria-label={`Edit set ${set.setNumber}`}
              className={`flex min-h-12 w-full items-center justify-between rounded-lg border px-3 text-left ${
                editingSetId === set.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                <span aria-hidden="true" className="mr-2 text-green-600">✓</span>Set {set.setNumber}
              </span>
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {formatSet(set.weightKg, set.reps)}
                {set.rir !== undefined && <span className="text-neutral-500"> · RIR {set.rir}</span>}
              </span>
            </button>
          ))}
          {sets && sets.length === 0 && <p className="text-sm text-neutral-500">Nothing logged yet — your first set is one tap away.</p>}
          {sets && sets.length > 0 && editingSetId === null && (
            <p className="text-xs text-neutral-500">Tap a set to fix a mistake.</p>
          )}
        </div>
      </div>

      {/* Sticky action bar: the one thing to do next is always reachable with a thumb. */}
      <div className="sticky bottom-14 z-30 -mx-4 mt-6 border-t border-neutral-200 bg-neutral-50/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        {editingSetId !== null ? (
          <>
            <p className="mb-2 text-center text-sm font-medium text-blue-700 dark:text-blue-400">Editing a logged set</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="min-h-12 flex-1 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button type="button" onClick={handleUpdateSet} className="min-h-12 flex-1 rounded-xl bg-blue-600 text-base font-semibold text-white active:bg-blue-700">
                Save Set
              </button>
            </div>
            <button type="button" onClick={handleDeleteEditing} className="mt-1 min-h-10 w-full text-sm font-medium text-red-600">
              Delete this set
            </button>
          </>
        ) : allDone && !addingExtra ? (
          <>
            <button
              type="button"
              onClick={onNext}
              className="min-h-14 w-full rounded-xl bg-neutral-900 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              {nextExercise ? `Next: ${nextExercise.name} →` : 'All exercises done → Review'}
            </button>
            <button
              type="button"
              onClick={() => setAddingExtra(true)}
              className="mt-1 min-h-10 w-full text-sm font-medium text-neutral-600 dark:text-neutral-400"
            >
              Add another set
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleLogSet}
            className="min-h-14 w-full rounded-xl bg-neutral-900 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
          >
            {allDone ? 'Log extra set' : `Log set ${loggedCount + 1} of ${planned.targetSets}`}
          </button>
        )}
      </div>
    </div>
  )
}
