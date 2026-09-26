import { useLiveQuery } from 'dexie-react-hooks'
import { QuickField } from '../../components/QuickField'
import { SectionHeader } from '../../components/SectionHeader'
import { formatShortDate } from '../../utils/date'
import { safely } from '../../utils/safely'
import { getTodayBodyLog, listRecentBodyLogs, upsertBodyLog } from './repository'

export function BodyCard() {
  const todayLog = useLiveQuery(() => getTodayBodyLog(), [])
  const recent = useLiveQuery(() => listRecentBodyLogs(6), [])

  const older = recent?.filter((log) => log.id !== todayLog?.id) ?? []
  // Remember the last logged values so today's entry starts from a familiar number.
  const lastWeight = older.find((log) => log.weightKg !== undefined)?.weightKg
  const lastWaist = older.find((log) => log.waistCm !== undefined)?.waistCm

  return (
    <section id="log-body" className="py-4">
      <SectionHeader title="Body" status={todayLog?.weightKg !== undefined ? `${todayLog.weightKg} kg` : 'Not logged yet'} />

      <div className="mt-3 max-w-48">
        <QuickField
          label="Weight (kg)"
          step="0.1"
          value={todayLog?.weightKg}
          placeholder={lastWeight !== undefined ? String(lastWeight) : '—'}
          onSave={(weightKg) => safely(() => upsertBodyLog({ weightKg }))}
        />
      </div>

      <details className="group mt-3">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden text-sm font-medium text-neutral-600 dark:text-neutral-300">
          Waist &amp; recent weigh-ins
          <span aria-hidden="true" className="text-neutral-500 transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="mt-2 max-w-48">
          <QuickField
            label="Waist (cm)"
            step="0.1"
            value={todayLog?.waistCm}
            placeholder={lastWaist !== undefined ? String(lastWaist) : 'optional'}
            onSave={(waistCm) => safely(() => upsertBodyLog({ waistCm }))}
          />
        </div>
        {older.length > 0 && (
          <div className="mt-3 space-y-1">
            {older.map((log) => (
              <div key={log.id} className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                <span>{formatShortDate(log.date)}</span>
                <span>
                  {log.weightKg !== undefined ? `${log.weightKg} kg` : '—'}
                  {log.waistCm !== undefined ? ` · ${log.waistCm} cm` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </details>
    </section>
  )
}
