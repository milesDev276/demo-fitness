import { db } from '../../db/db'
import type { Meal, NutritionLog } from '../../db/types'

const today = () => new Date().toISOString().slice(0, 10)

export function getTodayNutritionLog() {
  return db.nutritionLogs.where('date').equals(today()).first()
}

export async function upsertNutritionTotals(
  changes: Partial<Pick<NutritionLog, 'calories' | 'proteinG' | 'carbsG' | 'fatG'>>,
) {
  const date = today()
  const existing = await db.nutritionLogs.where('date').equals(date).first()
  if (existing) {
    await db.nutritionLogs.update(existing.id!, changes)
  } else {
    await db.nutritionLogs.add({ date, ...changes })
  }
}

export async function addMeal(meal: Omit<Meal, 'id'>) {
  const date = today()
  const existing = await db.nutritionLogs.where('date').equals(date).first()
  const newMeal: Meal = { ...meal, id: crypto.randomUUID() }
  if (existing) {
    await db.nutritionLogs.update(existing.id!, { meals: [...(existing.meals ?? []), newMeal] })
  } else {
    await db.nutritionLogs.add({ date, meals: [newMeal] })
  }
}

export async function deleteMeal(mealId: string) {
  const existing = await db.nutritionLogs.where('date').equals(today()).first()
  if (!existing) return
  await db.nutritionLogs.update(existing.id!, {
    meals: (existing.meals ?? []).filter((m) => m.id !== mealId),
  })
}
