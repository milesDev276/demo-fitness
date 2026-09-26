import { db } from '../../db/db'
import type { DailyCheckIn } from '../../db/types'
import { todayLocalDate } from '../../utils/date'

const today = todayLocalDate

export function getTodayCheckIn() {
  return db.dailyCheckIns.where('date').equals(today()).first()
}

/** Transactional so quick successive taps (sleep, energy, soreness) can't create duplicate rows for today. */
export function upsertCheckIn(changes: Partial<Pick<DailyCheckIn, 'sleepHours' | 'energy' | 'soreness'>>) {
  return db.transaction('rw', db.dailyCheckIns, async () => {
    const date = today()
    const existing = await db.dailyCheckIns.where('date').equals(date).first()
    if (existing) {
      await db.dailyCheckIns.update(existing.id!, changes)
    } else {
      await db.dailyCheckIns.add({ date, ...changes })
    }
  })
}

/** The most recent check-in before today, used to pre-suggest sleep. */
export async function getPreviousSleepHours(): Promise<number | undefined> {
  const recent = await db.dailyCheckIns.orderBy('date').reverse().limit(10).toArray()
  return recent.find((c) => c.date !== today() && c.sleepHours !== undefined)?.sleepHours
}
