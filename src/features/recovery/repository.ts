import { db } from '../../db/db'
import type { DailyCheckIn } from '../../db/types'

const today = () => new Date().toISOString().slice(0, 10)

export function getTodayCheckIn() {
  return db.dailyCheckIns.where('date').equals(today()).first()
}

export async function upsertCheckIn(
  changes: Partial<Pick<DailyCheckIn, 'sleepHours' | 'energy' | 'soreness'>>,
) {
  const date = today()
  const existing = await db.dailyCheckIns.where('date').equals(date).first()
  if (existing) {
    await db.dailyCheckIns.update(existing.id!, changes)
  } else {
    await db.dailyCheckIns.add({ date, ...changes })
  }
}
