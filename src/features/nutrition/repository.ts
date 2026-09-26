import { db } from '../../db/db'
import type { Meal, NutritionLog } from '../../db/types'
import { todayLocalDate } from '../../utils/date'

const today = todayLocalDate

export function getTodayNutritionLog() {
  return db.nutritionLogs.where('date').equals(today()).first()
}

// All writes are transactional so quick successive saves can't create two rows for the same day.
export function upsertNutritionTotals(changes: Partial<Pick<NutritionLog, 'calories' | 'proteinG' | 'carbsG' | 'fatG'>>) {
  return db.transaction('rw', db.nutritionLogs, async () => {
    const date = today()
    const existing = await db.nutritionLogs.where('date').equals(date).first()
    if (existing) {
      await db.nutritionLogs.update(existing.id!, changes)
    } else {
      await db.nutritionLogs.add({ date, ...changes })
    }
  })
}

export function addMeal(meal: Omit<Meal, 'id'>) {
  return db.transaction('rw', db.nutritionLogs, async () => {
    const date = today()
    const existing = await db.nutritionLogs.where('date').equals(date).first()
    const newMeal: Meal = { ...meal, id: crypto.randomUUID() }
    if (existing) {
      await db.nutritionLogs.update(existing.id!, { meals: [...(existing.meals ?? []), newMeal] })
    } else {
      await db.nutritionLogs.add({ date, meals: [newMeal] })
    }
  })
}

export function deleteMeal(mealId: string) {
  return db.transaction('rw', db.nutritionLogs, async () => {
    const existing = await db.nutritionLogs.where('date').equals(today()).first()
    if (!existing) return
    await db.nutritionLogs.update(existing.id!, {
      meals: (existing.meals ?? []).filter((m) => m.id !== mealId),
    })
  })
}
