import { useLiveQuery } from 'dexie-react-hooks'
import type { EquipmentAccess, ExperienceLevel } from '../../db/types'
import { NumberField } from '../../components/NumberField'
import { safely } from '../../utils/safely'
import { getProfile, updateProfile } from './repository'

function save(changes: Parameters<typeof updateProfile>[0]) {
  return safely(() => updateProfile(changes))
}

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const EQUIPMENT_OPTIONS: { value: EquipmentAccess; label: string }[] = [
  { value: 'gym', label: 'Gym' },
  { value: 'home', label: 'Home' },
  { value: 'bodyweight', label: 'Bodyweight' },
]

export function ProfileCard() {
  const profile = useLiveQuery(() => getProfile(), [])

  if (!profile) return null

  function toggleDay(day: number) {
    const set = new Set(profile!.availableDays)
    if (set.has(day)) set.delete(day)
    else set.add(day)
    save({ availableDays: Array.from(set) })
  }

  function toggleEquipment(value: EquipmentAccess) {
    const set = new Set(profile!.equipment)
    if (set.has(value)) {
      if (set.size === 1) return // always keep at least one option selected
      set.delete(value)
    } else {
      set.add(value)
    }
    save({ equipment: Array.from(set) })
  }

  const muscularPercent = Math.round(profile.goalMuscularEmphasis * 100)

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Training Setup</h2>

      <div className="mt-3">
        <p className="text-[11px] uppercase text-neutral-400">Available training days</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DAY_LABELS.map(({ value, label }) => {
            const active = profile.availableDays.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleDay(value)}
                aria-pressed={active}
                className={`h-10 w-12 rounded-lg text-xs font-semibold ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          {profile.availableDays.length} day{profile.availableDays.length === 1 ? '' : 's'} available this week
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <NumberField
          label="Sessions per week"
          value={profile.trainingDaysPerWeek}
          min={1}
          max={7}
          onCommit={(trainingDaysPerWeek) => save({ trainingDaysPerWeek })}
        />
        <NumberField
          label="Session length (min)"
          value={profile.sessionDurationMinutes}
          min={30}
          max={120}
          step={5}
          onCommit={(sessionDurationMinutes) => save({ sessionDurationMinutes })}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] uppercase text-neutral-400">
          <span>Muscular {muscularPercent}%</span>
          <span>Athletic {100 - muscularPercent}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={muscularPercent}
          onChange={(e) => {
            const value = Number(e.target.value)
            save({ goalMuscularEmphasis: value / 100, goalAthleticEmphasis: (100 - value) / 100 })
          }}
          aria-label="Muscular versus athletic emphasis"
          className="mt-2 w-full"
        />
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase text-neutral-400">Experience</p>
        <div className="mt-2 flex gap-1.5">
          {EXPERIENCE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => save({ experience: value })}
              aria-pressed={profile.experience === value}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                profile.experience === value
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase text-neutral-400">Equipment access</p>
        <div className="mt-2 flex gap-1.5">
          {EQUIPMENT_OPTIONS.map(({ value, label }) => {
            const active = profile.equipment.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleEquipment(value)}
                aria-pressed={active}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-xs text-neutral-400">The weekly planner only picks exercises you can actually do.</p>
      </div>
    </section>
  )
}
