import { useLiveQuery } from 'dexie-react-hooks'
import { QuickField } from '../../components/QuickField'
import { SectionHeader } from '../../components/SectionHeader'
import { safely } from '../../utils/safely'
import { getPreviousSleepHours, getTodayCheckIn, upsertCheckIn } from './repository'

const SCALE = Array.from({ length: 10 }, (_, i) => i + 1)

export function RecoveryCard() {
  const checkIn = useLiveQuery(() => getTodayCheckIn(), [])
  const previousSleep = useLiveQuery(() => getPreviousSleepHours(), [])

  const logged = [checkIn?.sleepHours, checkIn?.energy, checkIn?.soreness].filter((v) => v !== undefined).length
  const status = logged === 0 ? 'Not logged yet' : logged === 3 ? 'Done' : `${logged} of 3 logged`

  return (
    <section id="log-recovery" className="py-4">
      <SectionHeader title="Recovery" status={status} />

      <div className="mt-3 max-w-48">
        <QuickField
          label="Sleep (hours)"
          step="0.5"
          value={checkIn?.sleepHours}
          placeholder={previousSleep !== undefined ? String(previousSleep) : '—'}
          onSave={(sleepHours) => safely(() => upsertCheckIn({ sleepHours }))}
        />
      </div>

      <ScalePicker
        label="Energy"
        hint="1 = drained · 10 = great"
        selected={checkIn?.energy}
        onPick={(energy) => safely(() => upsertCheckIn({ energy }))}
      />
      <ScalePicker
        label="Soreness"
        hint="1 = none · 10 = very sore"
        selected={checkIn?.soreness}
        onPick={(soreness) => safely(() => upsertCheckIn({ soreness }))}
      />
    </section>
  )
}

function ScalePicker({
  label,
  hint,
  selected,
  onPick,
}: {
  label: string
  hint: string
  selected: number | undefined
  onPick: (value: number) => void
}) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase text-neutral-500">
        {label} <span className="normal-case">· {hint}</span>
      </p>
      <div role="group" aria-label={label} className="mt-1.5 grid grid-cols-10 gap-1">
        {SCALE.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            aria-pressed={selected === value}
            aria-label={`${label} ${value} out of 10`}
            className={`h-11 rounded-lg text-sm font-semibold ${
              selected === value
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}
