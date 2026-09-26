import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { InfoTip } from '../../components/InfoTip'
import { formatCompactDate } from '../../utils/date'
import { formatSet } from '../../utils/format'
import { summarizeStrength } from './calculations'
import { getSetsForExercise, listExercisesWithHistory } from './repository'

export function StrengthProgressCard() {
  const exercises = useLiveQuery(
    () => listExercisesWithHistory().then((list) => list.filter((e) => e.category !== 'cardio')),
    [],
  )
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const effectiveId = selectedId ?? exercises?.[0]?.exerciseId ?? null

  const history = useLiveQuery(
    () => (effectiveId !== null ? getSetsForExercise(effectiveId) : Promise.resolve([])),
    [effectiveId],
  )

  const summary = useMemo(() => (history ? summarizeStrength(history) : null), [history])

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Strength</h3>

      {!exercises ? null : exercises.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          No strength data yet. Complete a workout and your lifts will show up here.
        </p>
      ) : (
        <>
          <select
            value={effectiveId ?? ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          >
            {exercises.map((e) => (
              <option key={e.exerciseId} value={e.exerciseId}>
                {e.name}
              </option>
            ))}
          </select>

          {summary && summary.recent.length > 0 && (
            <>
              {summary.recent.length >= 2 && summary.recent.some((r) => r.set.weightKg > 0) && (
                <div className="mt-3 h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={summary.recent.map((r) => ({ date: r.date, value: r.set.weightKg }))}
                      margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                    >
                      <XAxis dataKey="date" tickFormatter={formatCompactDate} tick={{ fontSize: 10 }} minTickGap={24} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} width={36} />
                      <Tooltip
                        labelFormatter={(d) => formatCompactDate(String(d))}
                        formatter={(v) => [`${v} kg`, 'Top set']}
                      />
                      <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-3">
                <p className="text-xs uppercase text-neutral-500">Recent</p>
                <div className="mt-1 space-y-0.5">
                  {summary.recent.map((r) => (
                    <p key={r.date} className="text-sm text-neutral-700 dark:text-neutral-300">
                      {formatSet(r.set.weightKg, r.set.reps)}
                    </p>
                  ))}
                </div>
              </div>

              {summary.best && (
                <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-900">
                  <p className="text-xs uppercase text-neutral-500">Best</p>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {formatSet(summary.best.weightKg, summary.best.reps)}
                  </p>
                  {summary.estimated1RM !== null && summary.estimated1RM > 0 && (
                    <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                      Estimated max for 1 rep: ~{summary.estimated1RM}kg
                      <InfoTip term="estimated max">
                        A calculated guess at the heaviest weight you could lift once, based on your best set. It is not a test — no need to try it.
                      </InfoTip>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
