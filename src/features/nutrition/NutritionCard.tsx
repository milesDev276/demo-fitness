import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { QuickField } from '../../components/QuickField'
import { SectionHeader } from '../../components/SectionHeader'
import type { NutritionLog } from '../../db/types'
import { safely } from '../../utils/safely'
import { getProfile } from '../profile/repository'
import { addMeal, deleteMeal, getTodayNutritionLog, upsertNutritionTotals } from './repository'

type TotalsKey = 'calories' | 'proteinG' | 'carbsG' | 'fatG'
type TargetKey = 'calorieTarget' | 'proteinTarget' | 'carbTarget' | 'fatTarget'
type FieldDef = { key: TotalsKey; label: string; targetKey: TargetKey }

const MAIN_FIELDS: FieldDef[] = [
  { key: 'calories', label: 'Calories', targetKey: 'calorieTarget' },
  { key: 'proteinG', label: 'Protein (g)', targetKey: 'proteinTarget' },
]
const MORE_FIELDS: FieldDef[] = [
  { key: 'carbsG', label: 'Carbs (g)', targetKey: 'carbTarget' },
  { key: 'fatG', label: 'Fat (g)', targetKey: 'fatTarget' },
]

const EMPTY_MEAL_FORM = { name: '', calories: '', proteinG: '', carbsG: '', fatG: '' }
const MEAL_INPUT =
  'rounded-lg border border-neutral-200 px-2 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white'
const MEAL_NUMBER_FIELDS = [
  ['calories', 'kcal'],
  ['proteinG', 'Protein g'],
  ['carbsG', 'Carbs g'],
  ['fatG', 'Fat g'],
] as const

export function NutritionCard() {
  const log = useLiveQuery(() => getTodayNutritionLog(), [])
  const profile = useLiveQuery(() => getProfile(), [])

  const [mealForm, setMealForm] = useState(EMPTY_MEAL_FORM)
  const [showMealForm, setShowMealForm] = useState(false)

  function save(key: TotalsKey, value: number | undefined) {
    return safely(() => upsertNutritionTotals({ [key]: value } as Partial<Pick<NutritionLog, TotalsKey>>))
  }

  function renderField({ key, label, targetKey }: FieldDef) {
    const target = profile?.[targetKey]
    return (
      <QuickField
        key={key}
        label={label}
        inputMode="numeric"
        value={log?.[key]}
        hint={target !== undefined ? `/ ${target}` : undefined}
        onSave={(value) => save(key, value)}
      />
    )
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
  const calorieTarget = profile?.calorieTarget
  const summary =
    log?.calories !== undefined
      ? `${log.calories}${calorieTarget !== undefined ? ` of ${calorieTarget}` : ''} kcal`
      : 'Not logged yet'

  return (
    <section id="log-nutrition" className="py-4">
      <SectionHeader title="Nutrition" status={summary} />

      <div className="mt-3 grid grid-cols-2 gap-3">{MAIN_FIELDS.map(renderField)}</div>

      <details className="group mt-3">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden text-sm font-medium text-neutral-600 dark:text-neutral-300">
          Carbs, fat &amp; meals{meals.length > 0 ? ` (${meals.length})` : ''}
          <span aria-hidden="true" className="text-neutral-500 transition-transform group-open:rotate-180">▾</span>
        </summary>

        <div className="mt-2 grid grid-cols-2 gap-3">{MORE_FIELDS.map(renderField)}</div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-neutral-500">Meals</p>
            <button
              type="button"
              onClick={() => setShowMealForm((v) => !v)}
              className="-my-2 py-2 pl-3 text-sm font-medium text-blue-600"
            >
              {showMealForm ? 'Cancel' : '+ Add meal'}
            </button>
          </div>
          <p className="text-xs text-neutral-500">Optional. Meals are a note; the totals above are what counts.</p>

          {showMealForm && (
            <div className="mt-2 space-y-2 rounded-lg bg-neutral-100 p-3 dark:bg-neutral-900">
              <input
                type="text"
                value={mealForm.name}
                onChange={(e) => setMealForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Meal name"
                aria-label="Meal name"
                className={`w-full ${MEAL_INPUT}`}
              />
              <div className="grid grid-cols-4 gap-2">
                {MEAL_NUMBER_FIELDS.map(([field, label]) => (
                  <input
                    key={field}
                    type="number"
                    inputMode="numeric"
                    placeholder={label}
                    aria-label={label}
                    value={mealForm[field]}
                    onChange={(e) => setMealForm((f) => ({ ...f, [field]: e.target.value }))}
                    className={MEAL_INPUT}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddMeal}
                className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
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
                    className="ml-2 h-10 w-10 shrink-0 rounded-md text-red-500"
                    aria-label={`Delete ${meal.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </section>
  )
}
