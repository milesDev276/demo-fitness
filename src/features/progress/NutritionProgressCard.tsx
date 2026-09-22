import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, todayLocalDate } from '../../utils/date'
import { summarizeNutrition } from './calculations'
import { listNutritionLogsSince } from './repository'

const RANGE_DAYS = 30

export function NutritionProgressCard() {
  const startDate = useMemo(() => addDays(todayLocalDate(), -RANGE_DAYS), [])
  const logs = useLiveQuery(() => listNutritionLogsSince(startDate), [startDate])
  const summary = useMemo(() => (logs ? summarizeNutrition(logs) : null), [logs])

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Nutrition</h3>

      {!summary ? null : summary.daysLogged === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">Not enough nutrition data yet. Log meals to see averages.</p>
      ) : (
        <div className="mt-3 flex gap-6">
          <div>
            <p className="text-[11px] uppercase text-neutral-400">Avg calories ({RANGE_DAYS}D)</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {summary.avgCalories !== null ? `${summary.avgCalories} kcal` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-neutral-400">Avg protein ({RANGE_DAYS}D)</p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              {summary.avgProtein !== null ? `${summary.avgProtein} g` : '—'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
