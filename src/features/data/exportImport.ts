import { db } from '../../db/db'
import type {
  BodyLog,
  DailyCheckIn,
  Exercise,
  NutritionLog,
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
  WorkoutSet,
} from '../../db/types'

export const EXPORT_VERSION = 1

export interface ExportPayload {
  version: typeof EXPORT_VERSION
  exportedAt: string
  userProfile: UserProfile[]
  exercises: Exercise[]
  workoutPlans: WorkoutPlan[]
  workoutSessions: WorkoutSession[]
  workoutSets: WorkoutSet[]
  bodyLogs: BodyLog[]
  dailyCheckIns: DailyCheckIn[]
  nutritionLogs: NutritionLog[]
}

/** Keys that must be present and hold arrays for a payload to be considered a FitFlow export. */
const REQUIRED_ARRAY_KEYS: (keyof Omit<ExportPayload, 'version' | 'exportedAt'>)[] = [
  'userProfile',
  'exercises',
  'workoutPlans',
  'workoutSessions',
  'workoutSets',
  'bodyLogs',
  'dailyCheckIns',
  'nutritionLogs',
]

export async function exportAllData(): Promise<ExportPayload> {
  const [userProfile, exercises, workoutPlans, workoutSessions, workoutSets, bodyLogs, dailyCheckIns, nutritionLogs] =
    await Promise.all([
      db.userProfile.toArray(),
      db.exercises.toArray(),
      db.workoutPlans.toArray(),
      db.workoutSessions.toArray(),
      db.workoutSets.toArray(),
      db.bodyLogs.toArray(),
      db.dailyCheckIns.toArray(),
      db.nutritionLogs.toArray(),
    ])

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    userProfile,
    exercises,
    workoutPlans,
    workoutSessions,
    workoutSets,
    bodyLogs,
    dailyCheckIns,
    nutritionLogs,
  }
}

export function downloadJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportValidationResult = { valid: true; payload: ExportPayload } | { valid: false; error: string }

type Row = Record<string, unknown>
const isRow = (value: unknown): value is Row => typeof value === 'object' && value !== null && !Array.isArray(value)
const isNum = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
const isStr = (value: unknown) => typeof value === 'string'
const isDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const isOptNum = (value: unknown) => value === undefined || isNum(value)

/** Minimal per-row checks — enough to reject a wrong/corrupted file before anything is cleared. */
const ROW_CHECKS: Record<(typeof REQUIRED_ARRAY_KEYS)[number], (row: Row) => boolean> = {
  userProfile: (r) =>
    isNum(r.age) && isNum(r.heightCm) && isNum(r.weightKg) && (r.availableDays === undefined || Array.isArray(r.availableDays)),
  exercises: (r) => isStr(r.name) && isStr(r.category) && isStr(r.primaryMuscle),
  workoutPlans: (r) => isStr(r.name) && Array.isArray(r.exercises),
  workoutSessions: (r) => isNum(r.planId) && isDate(r.date) && (r.status === 'in_progress' || r.status === 'completed'),
  workoutSets: (r) => isNum(r.sessionId) && isNum(r.exerciseId) && isNum(r.weightKg) && isNum(r.reps),
  bodyLogs: (r) => isDate(r.date) && isOptNum(r.weightKg) && isOptNum(r.waistCm),
  dailyCheckIns: (r) => isDate(r.date) && isOptNum(r.sleepHours) && isOptNum(r.energy) && isOptNum(r.soreness),
  nutritionLogs: (r) => isDate(r.date) && isOptNum(r.calories) && isOptNum(r.proteinG),
}

/** Shape check run before any existing data is touched. */
export function validateImportPayload(raw: unknown): ImportValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: 'This file is not a valid FitFlow export.' }
  }
  const candidate = raw as Record<string, unknown>

  if (candidate.version !== EXPORT_VERSION) {
    return { valid: false, error: 'This export is from an incompatible version of FitFlow.' }
  }

  for (const key of REQUIRED_ARRAY_KEYS) {
    if (!Array.isArray(candidate[key])) {
      return { valid: false, error: 'This file is missing expected FitFlow data and cannot be imported.' }
    }
    if (!(candidate[key] as unknown[]).every((row) => isRow(row) && ROW_CHECKS[key](row))) {
      return { valid: false, error: 'This file contains damaged or unexpected data and cannot be imported.' }
    }
  }

  // Sets and sessions point at exercises; without them the imported history would be unusable.
  if ((candidate.exercises as unknown[]).length === 0) {
    return { valid: false, error: 'This file has no exercise library and cannot be imported.' }
  }

  return { valid: true, payload: candidate as unknown as ExportPayload }
}

/** Replaces existing data wholesale — the caller is responsible for confirming with the user first. */
export async function importAllData(payload: ExportPayload): Promise<void> {
  await db.transaction(
    'rw',
    [db.userProfile, db.exercises, db.workoutPlans, db.workoutSessions, db.workoutSets, db.bodyLogs, db.dailyCheckIns, db.nutritionLogs],
    async () => {
      await Promise.all([
        db.userProfile.clear(),
        db.exercises.clear(),
        db.workoutPlans.clear(),
        db.workoutSessions.clear(),
        db.workoutSets.clear(),
        db.bodyLogs.clear(),
        db.dailyCheckIns.clear(),
        db.nutritionLogs.clear(),
      ])
      await Promise.all([
        db.userProfile.bulkPut(payload.userProfile),
        db.exercises.bulkPut(payload.exercises),
        db.workoutPlans.bulkPut(payload.workoutPlans),
        db.workoutSessions.bulkPut(payload.workoutSessions),
        db.workoutSets.bulkPut(payload.workoutSets),
        db.bodyLogs.bulkPut(payload.bodyLogs),
        db.dailyCheckIns.bulkPut(payload.dailyCheckIns),
        db.nutritionLogs.bulkPut(payload.nutritionLogs),
      ])
    },
  )
}
