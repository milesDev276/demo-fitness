import { db } from '../../../db/db'
import type { WorkoutPlan } from '../../../db/types'
import { getProfile } from '../../profile/repository'
import { todayLocalDate, addDays } from '../../../utils/date'
import { listCompletedSessionsSince } from '../../progress/repository'
import { getLatestRecoverySignal } from '../repository'
import { generateWeeklyPlan } from './weeklyPlanner'
import type { GeneratedWeekPlan, PlannerHistorySession } from './types'

/** Roughly 3 weeks — enough to judge recent volume/spacing without over-weighting one bad week. */
const HISTORY_WINDOW_DAYS = 21

async function loadRecentSessions(today: string): Promise<PlannerHistorySession[]> {
  const windowStart = addDays(today, -HISTORY_WINDOW_DAYS)
  const sessions = await listCompletedSessionsSince(windowStart)
  if (sessions.length === 0) return []

  const sessionIds = sessions.map((s) => s.id!)
  const allSets = await db.workoutSets.where('sessionId').anyOf(sessionIds).toArray()
  const setsBySession = new Map<number, typeof allSets>()
  for (const set of allSets) {
    const list = setsBySession.get(set.sessionId) ?? []
    list.push(set)
    setsBySession.set(set.sessionId, list)
  }

  return sessions.map((s) => ({
    date: s.date,
    sets: (setsBySession.get(s.id!) ?? []).map((set) => ({
      exerciseId: set.exerciseId,
      weightKg: set.weightKg,
      reps: set.reps,
      rir: set.rir,
    })),
  }))
}

/** Exercise ids from the most recently generated week, so the planner prefers keeping them (doc #17). */
async function loadPreviousPlanExerciseIds(): Promise<number[]> {
  const generatedPlans = await db.workoutPlans.filter((p) => p.isGenerated === true).toArray()
  if (generatedPlans.length === 0) return []

  const latestWeekStart = generatedPlans.reduce(
    (max, p) => (p.weekStart && p.weekStart > max ? p.weekStart : max),
    '',
  )
  const ids = new Set<number>()
  for (const plan of generatedPlans) {
    if (plan.weekStart === latestWeekStart) {
      for (const exercise of plan.exercises) ids.add(exercise.exerciseId)
    }
  }
  return Array.from(ids)
}

export async function buildWeeklyPlanPreview(): Promise<GeneratedWeekPlan> {
  const today = todayLocalDate()
  const [profile, exercises, recovery, recentSessions, previousPlanExerciseIds] = await Promise.all([
    getProfile(),
    db.exercises.toArray(),
    getLatestRecoverySignal(),
    loadRecentSessions(today),
    loadPreviousPlanExerciseIds(),
  ])

  return generateWeeklyPlan({
    today,
    availableDays: profile.availableDays,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    sessionDurationMinutes: profile.sessionDurationMinutes,
    goalMuscularEmphasis: profile.goalMuscularEmphasis,
    goalAthleticEmphasis: profile.goalAthleticEmphasis,
    experience: profile.experience,
    equipment: profile.equipment,
    exercises,
    recentSessions,
    previousPlanExerciseIds,
    recovery,
  })
}

/**
 * Persists the generated week as regular WorkoutPlans (doc #30 — no separate "GeneratedPlan"
 * system). Never touches a plan that a session has already been started from, so an in-progress
 * or completed workout is never orphaned by a later regenerate+accept (doc #24, #25).
 */
export async function acceptWeeklyPlan(weekPlan: GeneratedWeekPlan): Promise<number[]> {
  return db.transaction('rw', db.workoutPlans, db.workoutSessions, async () => {
    const existingForWeek = await db.workoutPlans.where('weekStart').equals(weekPlan.weekStart).toArray()
    const usedPlanIds = new Set((await db.workoutSessions.toArray()).map((s) => s.planId))
    const staleGeneratedIds = existingForWeek
      .filter((p) => p.isGenerated && !usedPlanIds.has(p.id!))
      .map((p) => p.id!)
    if (staleGeneratedIds.length > 0) {
      await db.workoutPlans.bulkDelete(staleGeneratedIds)
    }

    const timestamp = new Date().toISOString()
    const ids: number[] = []
    for (const day of weekPlan.days) {
      const plan: Omit<WorkoutPlan, 'id'> = {
        name: day.name,
        exercises: day.exercises,
        createdAt: timestamp,
        updatedAt: timestamp,
        isGenerated: true,
        templateKey: day.templateKey,
        scheduledDate: day.date,
        weekStart: weekPlan.weekStart,
        estimatedDurationMinutes: day.estimatedDurationMinutes,
        planningReason: day.notes.join(' '),
      }
      const id = await db.workoutPlans.add(plan)
      ids.push(id as number)
    }
    return ids
  })
}
