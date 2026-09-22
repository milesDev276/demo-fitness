import { db } from '../../db/db'
import type { BodyLog } from '../../db/types'

const today = () => new Date().toISOString().slice(0, 10)

export function getTodayBodyLog() {
  return db.bodyLogs.where('date').equals(today()).first()
}

export function listRecentBodyLogs(limit = 5) {
  return db.bodyLogs.orderBy('date').reverse().limit(limit).toArray()
}

export async function upsertBodyLog(changes: Partial<Pick<BodyLog, 'weightKg' | 'waistCm'>>) {
  const date = today()
  const existing = await db.bodyLogs.where('date').equals(date).first()
  if (existing) {
    await db.bodyLogs.update(existing.id!, changes)
  } else {
    await db.bodyLogs.add({ date, ...changes })
  }
}
