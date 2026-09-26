import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { NutritionLog } from '../../db/types'
import { safely } from '../../utils/safely'
import { getProfile } from '../profile/repository'
import { addMeal, deleteMeal, getTodayNutritionLog, upsertNutritionTotals } from './repository'

type TotalsKey = 'calories' | 'proteinG' | 'carbsG' | 'fatG'

const FIELDS: { key: TotalsKey; label: string; targetKey: 'calorieTarget' | 'proteinTarget' | 'carbTarget' | 'fatTarget' }[] = [
  { key: 'calories', label: 'Calories', targetKey: 'calorieTarget' },
  { key: 'proteinG', label: 'Protein (g)', targetKey: 'proteinTarget' },
  { key: 'carbsG', label: 'Carbs (g)', targetKey: 'carbTarget' },
  { key: 'fatG', label: 'Fat (g)', targetKey: 'fatTarget' },
]

const EMPTY_MEAL_FORM = { name: '', calories: '', proteinG: '', carbsG: '', fatG: '' }

export function NutritionCard() {
  const log = useLiveQuery(() => getTodayNutritionLog(), [])
  const profile = useLiveQuery(() => getProfile(), [])

  const [overrides, setOverrides] = useState<Partial<Record<TotalsKey, string>>>({})
  const [mealForm, setMealForm] = useState(EMPTY_MEAL_FORM)
  const [showMealForm, setShowMealForm] = useState(false)

  function valueFor(key: TotalsKey) {
    if (overrides[key] !== undefined) return overrides[key]
    const stored = log?.[key]
    return stored !== undefined ? String(stored) : ''
  }

  async function commit(key: TotalsKey) {
    const raw = valueFor(key)
    const value = raw === '' ? undefined : Number(raw)
    if (value !== undefined && Number.isNaN(value)) return
    const saved = await safely(() => upsertNutritionTotals({ [key]: value } as Partial<Pick<NutritionLog, TotalsKey>>))
    if (!saved) return
    setOverrides((o) => {
      const next = { ...o }
      delete next[key]
      return next
    })
  }

  async function handleAddMeal() {
    if (!mealForm.name.trim()) return
    const saved = await safely(() =>
      addMeal({
        name: mealForm.name.trim(),
        calories: Number(mealForm.calories) || 0,
        proteinG: Number(mealForm.proteinG) || 0,
        carbsG: Number(mealForm.carbsG) || 0,
        fatG: Number(mealForm.fatG) || 0,
      }),
    )
    if (!saved) return
    setMealForm(EMPTY_MEAL_FORM)
    setShowMealForm(false)
  }

  const meals = log?.meals ?? []

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Nutrition</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, targetKey }) => {
          const target = profile?.[targetKey]
          return (
            <label key={key} className="block">
              <span className="text-[11px] uppercase text-neutral-400">
                {label}
                {target !== undefined && <span className="normal-case text-neutral-400"> / {target}</span>}
              </span>
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
          )
        })}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase text-neutral-400">Meals</p>
          <button
            type="button"
            onClick={() => setShowMealForm((v) => !v)}
            className="-my-2 py-2 pl-3 text-sm font-medium text-blue-600"
          >
            {showMealForm ? 'Cancel' : '+ Add meal'}
          </button>
        </div>

        {showMealForm && (
          <div className="mt-2 space-y-2 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-900">
            <input
              type="text"
              value={mealForm.name}
              onChange={(e) => setMealForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Meal name"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
            />
            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="kcal"
                value={mealForm.calories}
                onChange={(e) => setMealForm((f) => ({ ...f, calories: e.target.value }))}
                className="rounded-lg border border-neutral-200 px-2 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="P"
                value={mealForm.proteinG}
                onChange={(e) => setMealForm((f) => ({ ...f, proteinG: e.target.value }))}
                className="rounded-lg border border-neutral-200 px-2 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="C"
                value={mealForm.carbsG}
                onChange={(e) => setMealForm((f) => ({ ...f, carbsG: e.target.value }))}
                className="rounded-lg border border-neutral-200 px-2 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="F"
                value={mealForm.fatG}
                onChange={(e) => setMealForm((f) => ({ ...f, fatG: e.target.value }))}
                className="rounded-lg border border-neutral-200 px-2 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddMeal}
              className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              Save Meal
            </button>
          </div>
        )}

        {meals.length > 0 && (
          <div className="mt-2 space-y-1">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
              >
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{meal.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {meal.calories} kcal · {meal.proteinG}p / {meal.carbsG}c / {meal.fatG}f
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => safely(() => deleteMeal(meal.id), "We couldn't remove this meal. Please try again.")}
                  className="ml-2 h-8 w-8 shrink-0 rounded-md text-red-500"
                  aria-label="Delete meal"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
