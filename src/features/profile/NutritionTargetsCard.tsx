import { useLiveQuery } from 'dexie-react-hooks'
import { QuickField } from '../../components/QuickField'
import type { UserProfile } from '../../db/types'
import { safely } from '../../utils/safely'
import { getProfile, updateProfile } from './repository'

type TargetKey = 'calorieTarget' | 'proteinTarget' | 'carbTarget' | 'fatTarget'

const FIELDS: { key: TargetKey; label: string }[] = [
  { key: 'calorieTarget', label: 'Calories' },
  { key: 'proteinTarget', label: 'Protein (g)' },
  { key: 'carbTarget', label: 'Carbs (g)' },
  { key: 'fatTarget', label: 'Fat (g)' },
]

export function NutritionTargetsCard() {
  const profile = useLiveQuery(() => getProfile(), [])

  if (!profile) return null

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Daily Nutrition Targets</h2>
      <p className="mt-1 text-xs text-neutral-500">Set manually — FitFlow won't change these for you. Carbs and fat are optional.</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label }) => (
          <QuickField
            key={key}
            label={label}
            inputMode="numeric"
            value={profile[key]}
            onSave={(value) => safely(() => updateProfile({ [key]: value } as Partial<Pick<UserProfile, TargetKey>>))}
          />
        ))}
      </div>
    </section>
  )
}
