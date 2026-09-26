import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { todayLocalDate } from '../../utils/date'
import { summarizeConsistency } from './calculations'
import { listAllCompletedSessions } from './repository'

export function ConsistencyCard() {
  const sessions = useLiveQuery(() => listAllCompletedSessions(), [])
  const summary = useMemo(
    () => (sessions ? summarizeConsistency(sessions, todayLocalDate()) : null),
    [sessions],
  )

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Consistency</h3>

      {!summary ? null : summary.totalCompleted === 0 ? (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          No workouts completed yet. Finish your first workout and your weekly rhythm will show here.
        </p>
      ) : (
        <>
          <div className="mt-3 flex gap-6">
            <div>
              <p className="text-xs uppercase text-neutral-500">This month</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                {summary.completedThisMonth} completed
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500">Last 4 weeks</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                {summary.weeklyAverageLast4Weeks}/week avg
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
