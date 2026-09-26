import { useState } from 'react'
import { safely } from '../../../utils/safely'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../db/db'
import { formatCompactDate, formatShortDate } from '../../../utils/date'
import { acceptWeeklyPlan, buildWeeklyPlanPreview } from './repository'
import type { GeneratedDayPlan } from './types'

interface WeeklyPlanScreenProps {
  onDone: () => void
}

export function WeeklyPlanScreen({ onDone }: WeeklyPlanScreenProps) {
  const [regenerateToken, setRegenerateToken] = useState(0)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const weekPlan = useLiveQuery(() => buildWeeklyPlanPreview(), [regenerateToken])
  const exerciseNames = useLiveQuery(
    () => db.exercises.toArray().then((list) => new Map(list.map((e) => [e.id!, e.name]))),
    [],
  )

  async function handleAccept() {
    if (!weekPlan) return
    setAccepting(true)
    const saved = await safely(() => acceptWeeklyPlan(weekPlan), "We couldn't save this plan. Please try again.")
    setAccepting(false)
    if (saved) setAccepted(true)
  }

  if (accepted) {
    return (
      <div className="p-4 pb-24">
        <p className="text-lg font-semibold text-neutral-900 dark:text-white">Next week's plan is saved.</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          You'll find each session in your Workout list, ready to start on its scheduled day.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-4 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 pb-28">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDone} className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Cancel
        </button>
        <h1 className="text-base font-semibold text-neutral-900 dark:text-white">Next Week</h1>
        <span className="w-12" />
      </div>

      {!weekPlan ? (
        <p className="mt-6 text-center text-sm text-neutral-400">Generating…</p>
      ) : (
        <>
          <p className="mt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {formatCompactDate(weekPlan.weekStart)} – {formatCompactDate(weekPlan.weekEnd)}
          </p>

          <div className="mt-4 space-y-3">
            {weekPlan.days.map((day) => (
              <DayCard key={day.date} day={day} exerciseNames={exerciseNames} />
            ))}
            {weekPlan.days.length === 0 && (
              <p className="mt-6 text-center text-sm text-neutral-400">
                No available training days are set. Add some in the Me tab first.
              </p>
            )}
          </div>

          {weekPlan.explanation.length > 0 && (
            <div className="mt-5 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Why this plan?</p>
              <ul className="mt-1.5 space-y-1">
                {weekPlan.explanation.map((line, i) => (
                  <li key={i} className="text-xs text-neutral-600 dark:text-neutral-300">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setRegenerateToken((t) => t + 1)}
              className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting || weekPlan.days.length === 0}
              className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white active:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {accepting ? 'Saving…' : 'Accept Plan'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function DayCard({ day, exerciseNames }: { day: GeneratedDayPlan; exerciseNames: Map<number, string> | undefined }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatShortDate(day.date)}</p>
        <p className="text-xs text-neutral-400">~{day.estimatedDurationMinutes} min</p>
      </div>
      <p className="mt-0.5 text-base font-medium text-neutral-900 dark:text-white">
        {day.templateLabel}
        {day.athleticLabel && <span className="text-neutral-500"> + {day.athleticLabel}</span>}
      </p>

      <ul className="mt-2 space-y-0.5">
        {day.exercises.map((planned) => (
          <li key={planned.exerciseId} className="text-xs text-neutral-500 dark:text-neutral-400">
            {exerciseNames?.get(planned.exerciseId) ?? '…'} · {planned.targetSets}×{planned.minReps}–{planned.maxReps}
          </li>
        ))}
      </ul>

      {day.notes.length > 0 && (
        <p className="mt-2 text-xs text-neutral-400">{day.notes.join(' ')}</p>
      )}
    </div>
  )
}
