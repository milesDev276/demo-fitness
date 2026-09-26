import { useLiveQuery } from 'dexie-react-hooks'
import { NumberField } from '../../components/NumberField'
import { safely } from '../../utils/safely'
import { getCurrentWeightKg } from '../body/repository'
import type { UserProfile } from '../../db/types'
import { getProfile, updateProfile } from './repository'

export function PersonalCard() {
  const profile = useLiveQuery(() => getProfile(), [])
  const currentWeight = useLiveQuery(() => getCurrentWeightKg(), [])

  if (!profile) return null

  function patch(changes: Partial<Pick<UserProfile, 'age' | 'sex' | 'heightCm'>>) {
    safely(() => updateProfile(changes))
  }

  const displayWeight = currentWeight ?? profile.weightKg

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Personal</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField label="Age" value={profile.age} min={10} max={100} onCommit={(age) => patch({ age })} />
        <NumberField label="Height (cm)" value={profile.heightCm} min={100} max={250} onCommit={(heightCm) => patch({ heightCm })} />
      </div>

      <div className="mt-3">
        <span className="text-xs uppercase text-neutral-500">Sex</span>
        <div className="mt-1 flex gap-1.5">
          {(['male', 'female', 'other'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => patch({ sex: value })}
              aria-pressed={profile.sex === value}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize ${
                profile.sex === value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-xs uppercase text-neutral-500">Current weight</span>
        <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{displayWeight} kg</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {currentWeight !== undefined
            ? 'From your most recent weight log on Today.'
            : 'Starting estimate — log your weight on Today to keep this current.'}
        </p>
      </div>
    </section>
  )
}
