import { db } from '../../db/db'
import type { BodyLog } from '../../db/types'
import { todayLocalDate } from '../../utils/date'

const today = todayLocalDate

export function getTodayBodyLog() {
  return db.bodyLogs.where('date').equals(today()).first()
}

export function listRecentBodyLogs(limit = 5) {
  return db.bodyLogs.orderBy('date').reverse().limit(limit).toArray()
}

/** The most recently logged weight, if any — the authoritative "current weight" once BodyLog has data (doc #15). */
export async function getCurrentWeightKg(): Promise<number | undefined> {
  const recent = await db.bodyLogs.orderBy('date').reverse().limit(30).toArray()
  return recent.find((log) => log.weightKg !== undefined)?.weightKg
}

/** Transactional so two quick saves (e.g. weight then waist) can't both create today's row. */
export function upsertBodyLog(changes: Partial<Pick<BodyLog, 'weightKg' | 'waistCm'>>) {
  return db.transaction('rw', db.bodyLogs, async () => {
    const date = today()
    const existing = await db.bodyLogs.where('date').equals(date).first()
    if (existing) {
      await db.bodyLogs.update(existing.id!, changes)
    } else {
      await db.bodyLogs.add({ date, ...changes })
    }
  })
}
