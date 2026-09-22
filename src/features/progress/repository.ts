import { db } from '../../db/db'
import type { WorkoutSession, WorkoutSet } from '../../db/types'

// ---- Body ----

export function listBodyLogsSince(startDate: string) {
  return db.bodyLogs.where('date').aboveOrEqual(startDate).sortBy('date')
}

export async function listWeightPoints(startDate: string) {
  const logs = await listBodyLogsSince(startDate)
  return logs.map((l) => ({ date: l.date, value: l.weightKg }))
}

export async function listWaistPoints(startDate: string) {
  const logs = await listBodyLogsSince(startDate)
  return logs.map((l) => ({ date: l.date, value: l.waistCm }))
}

// ---- Nutrition ----

export function listNutritionLogsSince(startDate: string) {
  return db.nutritionLogs.where('date').aboveOrEqual(startDate).sortBy('date')
}

// ---- Recovery ----

export function listCheckInsSince(startDate: string) {
  return db.dailyCheckIns.where('date').aboveOrEqual(startDate).sortBy('date')
}

// ---- Workout sessions ----

export async function listAllCompletedSessions(): Promise<WorkoutSession[]> {
  const sessions = await db.workoutSessions.where('status').equals('completed').toArray()
  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

export async function listCompletedSessionsSince(startDate: string): Promise<WorkoutSession[]> {
  const sessions = await listAllCompletedSessions()
  return sessions.filter((s) => s.date >= startDate)
}

// ---- Exercise history ----

export interface ExerciseHistorySummary {
  exerciseId: number
  name: string
  category: string
  sessionCount: number
  lastDate: string
}

export async function listExercisesWithHistory(): Promise<ExerciseHistorySummary[]> {
  const sessions = await listAllCompletedSessions()
  const sessionDateById = new Map(sessions.map((s) => [s.id!, s.date]))
  const sessionIds = new Set(sessionDateById.keys())

  const allSets = await db.workoutSets.toArray()
  const relevantSets = allSets.filter((s) => sessionIds.has(s.sessionId))

  const byExercise = new Map<number, { sessionIds: Set<number>; lastDate: string }>()
  for (const set of relevantSets) {
    const date = sessionDateById.get(set.sessionId)!
    const entry = byExercise.get(set.exerciseId) ?? { sessionIds: new Set<number>(), lastDate: date }
    entry.sessionIds.add(set.sessionId)
    if (date > entry.lastDate) entry.lastDate = date
    byExercise.set(set.exerciseId, entry)
  }

  const exerciseIds = Array.from(byExercise.keys())
  const exercises = await db.exercises.bulkGet(exerciseIds)

  const result: ExerciseHistorySummary[] = []
  exerciseIds.forEach((exerciseId, i) => {
    const exercise = exercises[i]
    if (!exercise) return
    const entry = byExercise.get(exerciseId)!
    result.push({
      exerciseId,
      name: exercise.name,
      category: exercise.category,
      sessionCount: entry.sessionIds.size,
      lastDate: entry.lastDate,
    })
  })

  return result.sort((a, b) => b.sessionCount - a.sessionCount || b.lastDate.localeCompare(a.lastDate))
}

export interface ExerciseSessionSets {
  sessionId: number
  date: string
  sets: WorkoutSet[]
}

export async function getSetsForExercise(exerciseId: number): Promise<ExerciseSessionSets[]> {
  const sessions = await listAllCompletedSessions()
  const sets = await db.workoutSets.where('exerciseId').equals(exerciseId).sortBy('setNumber')

  const bySession = new Map<number, WorkoutSet[]>()
  for (const set of sets) {
    const list = bySession.get(set.sessionId) ?? []
    list.push(set)
    bySession.set(set.sessionId, list)
  }

  return sessions
    .filter((s) => bySession.has(s.id!))
    .map((s) => ({ sessionId: s.id!, date: s.date, sets: bySession.get(s.id!)! }))
}
