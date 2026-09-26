import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useUiStore } from '../../store/useUiStore'
import { addDays, todayLocalDate } from '../../utils/date'
import { getProfile } from '../profile/repository'
import { summarizeNutrition } from './calculations'
import { listNutritionLogsSince } from './repository'

const RANGE_DAYS = 30

export function NutritionProgressCard() {
  const setActivePage = useUiStore((s) => s.setActivePage)
  const startDate = useMemo(() => addDays(todayLocalDate(), -RANGE_DAYS), [])
  const logs = useLiveQuery(() => listNutritionLogsSince(startDate), [startDate])
  const profile = useLiveQuery(() => getProfile(), [])
  const summary = useMemo(() => (logs ? summarizeNutrition(logs) : null), [logs])

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Nutrition · last {RANGE_DAYS} days</h3>

      {!summary ? null : summary.daysLogged === 0 ? (
        <div className="mt-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">No nutrition logged yet. Log calories and protein on Today to see your averages.</p>
          <button type="button" onClick={() => setActivePage('today')} className="mt-1 min-h-10 text-sm font-semibold text-blue-700 dark:text-blue-400">
            Log nutrition
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-8">
          <Average label="Calories" value={summary.avgCalories} unit="kcal" target={profile?.calorieTarget} />
          <Average label="Protein" value={summary.avgProtein} unit="g" target={profile?.proteinTarget} />
        </div>
      )}
      {summary && summary.daysLogged > 0 && (
        <p className="mt-2 text-xs text-neutral-500">Average over {summary.daysLogged} logged day{summary.daysLogged === 1 ? '' : 's'}.</p>
      )}
    </section>
  )
}

function Average({ label, value, unit, target }: { label: string; value: number | null; unit: string; target: number | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase text-neutral-500">Avg {label.toLowerCase()}</p>
      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{value !== null ? `${value} ${unit}` : '—'}</p>
      {target !== undefined && <p className="text-sm text-neutral-600 dark:text-neutral-400">target {target}</p>}
    </div>
  )
}
