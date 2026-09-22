import { db } from '../../db/db'
import type { PlannedExercise, WorkoutPlan, WorkoutSet } from '../../db/types'

const nowIso = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)

// ---- Plans ----

export function listPlans() {
  return db.workoutPlans.orderBy('name').toArray()
}

export function getPlan(id: number) {
  return db.workoutPlans.get(id)
}

export async function createPlan(name: string, exercises: PlannedExercise[]): Promise<number> {
  const timestamp = nowIso()
  const id = await db.workoutPlans.add({
    name,
    exercises,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  return id as number
}

export async function updatePlan(id: number, name: string, exercises: PlannedExercise[]) {
  await db.workoutPlans.update(id, { name, exercises, updatedAt: nowIso() })
}

export async function deletePlan(id: number) {
  await db.workoutPlans.delete(id)
}

// ---- Sessions ----

export function getActiveSession() {
  return db.workoutSessions.where('status').equals('in_progress').first()
}

export async function startSession(plan: WorkoutPlan): Promise<number> {
  if (!plan.id) throw new Error('Plan must be saved before starting a session')
  const id = await db.workoutSessions.add({
    planId: plan.id,
    planName: plan.name,
    date: today(),
    startTime: nowIso(),
    status: 'in_progress',
  })
  return id as number
}

export async function completeSession(sessionId: number) {
  const session = await db.workoutSessions.get(sessionId)
  if (!session) return
  const endTime = nowIso()
  const durationMinutes = Math.max(
    1,
    Math.round((new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 60000),
  )
  await db.workoutSessions.update(sessionId, { endTime, durationMinutes, status: 'completed' })
}

export async function cancelSession(sessionId: number) {
  await db.transaction('rw', db.workoutSessions, db.workoutSets, async () => {
    await db.workoutSets.where('sessionId').equals(sessionId).delete()
    await db.workoutSessions.delete(sessionId)
  })
}

export function listHistory() {
  return db.workoutSessions.where('status').equals('completed').reverse().sortBy('startTime')
}

export function getSession(sessionId: number) {
  return db.workoutSessions.get(sessionId)
}

// ---- Sets ----

export function listSetsForSession(sessionId: number) {
  return db.workoutSets.where('sessionId').equals(sessionId).sortBy('setNumber')
}

export async function addSet(input: {
  sessionId: number
  exerciseId: number
  weightKg: number
  reps: number
  rir?: number
}): Promise<number> {
  const existing = await db.workoutSets
    .where('sessionId')
    .equals(input.sessionId)
    .filter((s) => s.exerciseId === input.exerciseId)
    .toArray()
  const setNumber = existing.length + 1
  const id = await db.workoutSets.add({ ...input, setNumber })
  return id as number
}

export async function updateSet(
  id: number,
  changes: Partial<Pick<WorkoutSet, 'weightKg' | 'reps' | 'rir'>>,
) {
  await db.workoutSets.update(id, changes)
}

export async function deleteSet(id: number) {
  const set = await db.workoutSets.get(id)
  if (!set) return
  await db.transaction('rw', db.workoutSets, async () => {
    await db.workoutSets.delete(id)
    // Renumber remaining sets for this exercise so setNumber stays contiguous.
    const remaining = await db.workoutSets
      .where('sessionId')
      .equals(set.sessionId)
      .filter((s) => s.exerciseId === set.exerciseId)
      .sortBy('setNumber')
    await Promise.all(
      remaining.map((s, index) =>
        s.setNumber !== index + 1 ? db.workoutSets.update(s.id!, { setNumber: index + 1 }) : Promise.resolve(),
      ),
    )
  })
}

// ---- Previous performance ----

export interface PreviousPerformance {
  date: string
  sets: WorkoutSet[]
}

export async function getPreviousPerformance(
  exerciseId: number,
  excludeSessionId?: number,
): Promise<PreviousPerformance | null> {
  const sessions = await db.workoutSessions.where('status').equals('completed').reverse().sortBy('startTime')
  for (const session of sessions) {
    if (session.id === excludeSessionId) continue
    const sets = await db.workoutSets
      .where('sessionId')
      .equals(session.id!)
      .filter((s) => s.exerciseId === exerciseId)
      .sortBy('setNumber')
    if (sets.length > 0) {
      return { date: session.date, sets }
    }
  }
  return null
}

export async function getSessionSetsByExercise(sessionId: number) {
  const sets = await db.workoutSets.where('sessionId').equals(sessionId).sortBy('setNumber')
  const byExercise = new Map<number, WorkoutSet[]>()
  for (const set of sets) {
    const list = byExercise.get(set.exerciseId) ?? []
    list.push(set)
    byExercise.set(set.exerciseId, list)
  }
  return byExercise
}
