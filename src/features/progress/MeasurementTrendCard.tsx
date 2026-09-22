import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addDays, formatCompactDate, todayLocalDate } from '../../utils/date'
import { buildTrendSummary } from './calculations'
import { RangeToggle } from './RangeToggle'

interface RangeOption {
  value: string
  label: string
}

interface MeasurementPoint {
  date: string
  value: number | undefined
}

interface MeasurementTrendCardProps {
  title: string
  unit: string
  rangeOptions: RangeOption[]
  defaultRange: string
  fetchPoints: (startDate: string) => Promise<MeasurementPoint[]>
  emptyMessage: string
}

export function MeasurementTrendCard({
  title,
  unit,
  rangeOptions,
  defaultRange,
  fetchPoints,
  emptyMessage,
}: MeasurementTrendCardProps) {
  const [range, setRange] = useState(defaultRange)
  const startDate = useMemo(() => addDays(todayLocalDate(), -Number(range)), [range])
  const points = useLiveQuery(() => fetchPoints(startDate), [startDate, fetchPoints])

  const summary = useMemo(() => (points ? buildTrendSummary(points) : null), [points])
  const rangeLabel = rangeOptions.find((o) => o.value === range)?.label ?? range

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h3>
        <RangeToggle value={range} options={rangeOptions} onChange={setRange} />
      </div>

      {!summary ? null : summary.points.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">{emptyMessage}</p>
      ) : (
        <>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {summary.latest} {unit}
          </p>

          {summary.points.length >= 2 && (
            <div className="mt-3 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <XAxis dataKey="date" tickFormatter={formatCompactDate} tick={{ fontSize: 10 }} minTickGap={24} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} width={36} />
                  <Tooltip
                    labelFormatter={(d) => formatCompactDate(String(d))}
                    formatter={(v) => [`${v} ${unit}`, title]}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-3 flex gap-6 border-t border-neutral-100 pt-3 dark:border-neutral-900">
            <div>
              <p className="text-[11px] uppercase text-neutral-400">{rangeLabel} average</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {summary.average !== null ? `${summary.average} ${unit}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-400">Change</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {summary.change !== null
                  ? `${summary.change > 0 ? '+' : ''}${summary.change} ${unit}`
                  : 'Not enough data yet'}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
