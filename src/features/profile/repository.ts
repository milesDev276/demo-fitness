import { db } from '../../db/db'
import type { UserProfile } from '../../db/types'

const nowIso = () => new Date().toISOString()

/** Matches the owner's baseline in CLAUDE.md — used only the first time the app runs. */
const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  age: 24,
  sex: 'male',
  heightCm: 170,
  weightKg: 80,
  experience: 'beginner',
  trainingDaysPerWeek: 4,
  sessionDurationMinutes: 75,
  goalMuscularEmphasis: 0.5,
  goalAthleticEmphasis: 0.5,
  availableDays: [1, 2, 4, 6], // Mon, Tue, Thu, Sat
  equipment: ['gym'],
}

/** Fills fields missing from rows saved before they existed (or imported from older files), so the UI never sees undefined arrays. */
function withDefaults(stored: UserProfile): UserProfile {
  return { ...DEFAULT_PROFILE, ...stored }
}

/** Pure read — safe to call from useLiveQuery. Falls back to an unsaved default so the UI always has something to render. */
export async function getProfile(): Promise<UserProfile> {
  const existing = await db.userProfile.toCollection().first()
  if (existing) return withDefaults(existing)
  const timestamp = nowIso()
  return { ...DEFAULT_PROFILE, createdAt: timestamp, updatedAt: timestamp }
}

/** Creates the profile row on first use. Only call this outside a useLiveQuery querier (writes aren't allowed there). */
export async function getOrCreateProfile(): Promise<UserProfile> {
  // A transaction serialises concurrent first-run calls so only one profile row is ever created.
  return db.transaction('rw', db.userProfile, async () => {
    const existing = await db.userProfile.toCollection().first()
    if (existing) return withDefaults(existing)

    const timestamp = nowIso()
    const id = await db.userProfile.add({ ...DEFAULT_PROFILE, createdAt: timestamp, updatedAt: timestamp })
    return (await db.userProfile.get(id))!
  })
}

export async function updateProfile(changes: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) {
  const profile = await getOrCreateProfile()
  await db.userProfile.update(profile.id!, { ...changes, updatedAt: nowIso() })
}
