import 'fake-indexeddb/auto'
import { db } from '../db/db'

/** Gives each test a fresh (seeded) database so tests never see each other's data. */
export async function resetDb() {
  db.close()
  await db.delete()
  await db.open()
}
