import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { safely } from '../../utils/safely'
import { getTodayBodyLog, listRecentBodyLogs, upsertBodyLog } from './repository'

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function BodyCard() {
  const todayLog = useLiveQuery(() => getTodayBodyLog(), [])
  const recent = useLiveQuery(() => listRecentBodyLogs(5), [])

  const [weightOverride, setWeightOverride] = useState<string | null>(null)
  const [waistOverride, setWaistOverride] = useState<string | null>(null)

  const weight = weightOverride ?? (todayLog?.weightKg !== undefined ? String(todayLog.weightKg) : '')
  const waist = waistOverride ?? (todayLog?.waistCm !== undefined ? String(todayLog.waistCm) : '')

  async function commitWeight() {
    const value = weight === '' ? undefined : Number(weight)
    if (value !== undefined && Number.isNaN(value)) return
    if (await safely(() => upsertBodyLog({ weightKg: value }))) setWeightOverride(null)
  }

  async function commitWaist() {
    const value = waist === '' ? undefined : Number(waist)
    if (value !== undefined && Number.isNaN(value)) return
    if (await safely(() => upsertBodyLog({ waistCm: value }))) setWaistOverride(null)
  }

  const olderEntries = recent?.filter((log) => log.id !== todayLog?.id) ?? []
  // Remember the last logged values so today's entry starts from a familiar number.
  const lastWeight = olderEntries.find((log) => log.weightKg !== undefined)?.weightKg
  const lastWaist = olderEntries.find((log) => log.waistCm !== undefined)?.waistCm

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Body</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase text-neutral-400">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeightOverride(e.target.value)}
            onBlur={commitWeight}
            placeholder={lastWeight !== undefined ? String(lastWeight) : '—'}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase text-neutral-400">Waist (cm)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={waist}
            onChange={(e) => setWaistOverride(e.target.value)}
            onBlur={commitWaist}
            placeholder={lastWaist !== undefined ? String(lastWaist) : 'optional'}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
      </div>

      {olderEntries.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-neutral-100 pt-2 dark:border-neutral-900">
          {olderEntries.map((log) => (
            <div key={log.id} className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <span>{formatDate(log.date)}</span>
              <span>
                {log.weightKg !== undefined ? `${log.weightKg} kg` : '—'}
                {log.waistCm !== undefined ? ` · ${log.waistCm} cm` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
