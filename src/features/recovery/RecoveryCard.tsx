import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getTodayCheckIn, upsertCheckIn } from './repository'

const SCALE = Array.from({ length: 10 }, (_, i) => i + 1)

export function RecoveryCard() {
  const checkIn = useLiveQuery(() => getTodayCheckIn(), [])
  const [sleepOverride, setSleepOverride] = useState<string | null>(null)

  const sleep = sleepOverride ?? (checkIn?.sleepHours !== undefined ? String(checkIn.sleepHours) : '')

  async function commitSleep() {
    const value = sleep === '' ? undefined : Number(sleep)
    if (value !== undefined && Number.isNaN(value)) return
    await upsertCheckIn({ sleepHours: value })
    setSleepOverride(null)
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Recovery</h2>

      <label className="mt-3 block max-w-35">
        <span className="text-[11px] uppercase text-neutral-400">Sleep (hours)</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={sleep}
          onChange={(e) => setSleepOverride(e.target.value)}
          onBlur={commitSleep}
          placeholder="—"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        />
      </label>

      <div className="mt-3">
        <p className="text-[11px] uppercase text-neutral-400">Energy</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SCALE.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => upsertCheckIn({ energy: value })}
              className={`h-8 w-8 rounded-full text-xs font-semibold ${
                checkIn?.energy === value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase text-neutral-400">Soreness</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SCALE.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => upsertCheckIn({ soreness: value })}
              className={`h-8 w-8 rounded-full text-xs font-semibold ${
                checkIn?.soreness === value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
