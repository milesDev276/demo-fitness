import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
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
  const [overrides, setOverrides] = useState<Partial<Record<TargetKey, string>>>({})

  if (!profile) return null

  function valueFor(key: TargetKey) {
    if (overrides[key] !== undefined) return overrides[key]
    const stored = profile![key]
    return stored !== undefined ? String(stored) : ''
  }

  async function commit(key: TargetKey) {
    const raw = valueFor(key)
    const value = raw === '' ? undefined : Number(raw)
    if (value !== undefined && Number.isNaN(value)) return
    const saved = await safely(() => updateProfile({ [key]: value } as Partial<Pick<UserProfile, TargetKey>>))
    if (!saved) return
    setOverrides((o) => {
      const next = { ...o }
      delete next[key]
      return next
    })
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Nutrition Targets</h2>
      <p className="mt-1 text-xs text-neutral-400">
        Set manually — FitFlow won't change these for you.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="text-[11px] uppercase text-neutral-400">{label}</span>
            <input
              type="number"
              inputMode="numeric"
              value={valueFor(key)}
              onChange={(e) => setOverrides((o) => ({ ...o, [key]: e.target.value }))}
              onBlur={() => commit(key)}
              placeholder="—"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
          </label>
        ))}
      </div>
    </section>
  )
}
