import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../db/db'
import { formatCompactDate, formatShortDate } from '../../../utils/date'
import { safely } from '../../../utils/safely'
import { useUiStore } from '../../../store/useUiStore'
import { acceptWeeklyPlan, buildWeeklyPlanPreview, getDefaultPlanTarget } from './repository'
import type { GeneratedDayPlan, PlanTarget } from './types'

interface WeeklyPlanScreenProps {
  onDone: () => void
  /** Leave the planner and go to the Today tab. */
  onOpenToday: () => void
}

const TARGET_LABEL: Record<PlanTarget, string> = { this: 'Rest of this week', next: 'Next week' }

export function WeeklyPlanScreen({ onDone, onOpenToday }: WeeklyPlanScreenProps) {
  const setActivePage = useUiStore((s) => s.setActivePage)
  const [choice, setChoice] = useState<PlanTarget | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState<PlanTarget | null>(null)

  const defaultTarget = useLiveQuery(() => getDefaultPlanTarget(), [])
  const planFor = choice ?? defaultTarget
  const weekPlan = useLiveQuery(() => (planFor ? buildWeeklyPlanPreview(planFor) : undefined), [planFor])
  const exerciseNames = useLiveQuery(
    () => db.exercises.toArray().then((list) => new Map(list.map((e) => [e.id!, e.name]))),
    [],
  )

  async function handleAccept() {
    if (!weekPlan) return
    setAccepting(true)
    const saved = await safely(() => acceptWeeklyPlan(weekPlan), "We couldn't save this plan. Please try again.")
    setAccepting(false)
    if (saved) setAccepted(weekPlan.planFor)
  }

  if (accepted) {
    return (
      <div className="p-4 pb-24">
        <p className="text-lg font-semibold text-neutral-900 dark:text-white">
          {accepted === 'this' ? 'The rest of this week is planned.' : 'Next week is planned.'}
        </p>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Each session appears on Today on its day, ready to start.
        </p>
        <button
          type="button"
          onClick={onOpenToday}
          className="mt-4 min-h-12 w-full rounded-xl bg-neutral-900 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
        >
          See Today
        </button>
        <button type="button" onClick={onDone} className="mt-1 min-h-11 w-full text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Done
        </button>
      </div>
    )
  }

  const [headline, ...moreReasons] = weekPlan?.explanation ?? []

  return (
    <div className="p-4 pb-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDone} className="min-h-10 pr-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Cancel
        </button>
        <h1 className="text-base font-semibold text-neutral-900 dark:text-white">Plan Your Week</h1>
        <span className="w-14" />
      </div>

      <div role="group" aria-label="Which week to plan" className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900">
        {(['this', 'next'] as const).map((target) => (
          <button
            key={target}
            type="button"
            onClick={() => setChoice(target)}
            aria-pressed={planFor === target}
            className={`min-h-10 rounded-md text-sm font-medium ${
              planFor === target
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {TARGET_LABEL[target]}
          </button>
        ))}
      </div>

      {!weekPlan ? (
        <p className="mt-6 text-center text-sm text-neutral-500">Planning…</p>
      ) : (
        <>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            {formatCompactDate(weekPlan.weekStart)} – {formatCompactDate(weekPlan.weekEnd)}
            {headline && <> · {headline}</>}
          </p>

          <div className="mt-3 space-y-3">
            {weekPlan.days.map((day) => (
              <DayCard key={day.date} day={day} exerciseNames={exerciseNames} />
            ))}
            {weekPlan.days.length === 0 && (
              <div className="rounded-xl border border-neutral-200 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                {weekPlan.planFor === 'this'
                  ? 'None of your available training days are left this week.'
                  : 'No training days are available yet.'}{' '}
                <button type="button" onClick={() => setChoice(weekPlan.planFor === 'this' ? 'next' : 'this')} className="font-semibold text-blue-700 dark:text-blue-400">
                  {weekPlan.planFor === 'this' ? 'Plan next week instead' : 'Plan this week instead'}
                </button>
              </div>
            )}
          </div>

          {moreReasons.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Why this plan?</summary>
              <ul className="mt-1 space-y-1">
                {moreReasons.map((line, i) => (
                  <li key={i} className="text-sm text-neutral-600 dark:text-neutral-400">
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <button
            type="button"
            onClick={() => setActivePage('me')}
            className="mt-2 min-h-10 text-sm font-medium text-blue-700 dark:text-blue-400"
          >
            Change days or session length in Me
          </button>

          <div className="sticky bottom-14 z-30 -mx-4 mt-4 border-t border-neutral-200 bg-neutral-50/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting || weekPlan.days.length === 0}
              className="min-h-14 w-full rounded-xl bg-neutral-900 text-base font-semibold text-white active:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {accepting ? 'Saving…' : `Accept Plan (${weekPlan.days.length} workout${weekPlan.days.length === 1 ? '' : 's'})`}
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
        <p className="text-sm text-neutral-600 dark:text-neutral-400">~{day.estimatedDurationMinutes} min</p>
      </div>
      <p className="mt-0.5 text-base font-medium text-neutral-900 dark:text-white">
        {day.templateLabel}
        {day.athleticLabel && <span className="text-neutral-600 dark:text-neutral-400"> + {day.athleticLabel}</span>}
      </p>

      <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
        {day.exercises.map((planned) => exerciseNames?.get(planned.exerciseId) ?? '…').join(' · ')}
      </p>
    </div>
  )
}
