import type { NutritionLog, WorkoutSet } from '../../db/types'
import { addDays, startOfMonthLocal } from '../../utils/date'
import type { ExerciseSessionSets } from './repository'

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

// ---- Body / measurement trends ----

export interface TrendPoint {
  date: string
  value: number
}

export interface TrendSummary {
  points: TrendPoint[]
  latest: number | null
  latestDate: string | null
  average: number | null
  change: number | null
}

export function buildTrendSummary(entries: { date: string; value: number | undefined }[]): TrendSummary {
  const points = entries
    .filter((e): e is TrendPoint => e.value !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (points.length === 0) {
    return { points: [], latest: null, latestDate: null, average: null, change: null }
  }

  const latestPoint = points[points.length - 1]
  const average = points.reduce((sum, p) => sum + p.value, 0) / points.length
  const change = points.length >= 2 ? latestPoint.value - points[0].value : null

  return {
    points,
    latest: latestPoint.value,
    latestDate: latestPoint.date,
    average: round(average, 1),
    change: change !== null ? round(change, 1) : null,
  }
}

// ---- Strength ----

export function topSetOf(sets: WorkoutSet[]): WorkoutSet | null {
  if (sets.length === 0) return null
  return sets.reduce((best, s) => {
    if (s.weightKg > best.weightKg) return s
    if (s.weightKg === best.weightKg && s.reps > best.reps) return s
    return best
  })
}

export interface StrengthSummary {
  recent: { date: string; set: WorkoutSet }[]
  best: WorkoutSet | null
  estimated1RM: number | null
}

export function summarizeStrength(history: ExerciseSessionSets[], recentCount = 5): StrengthSummary {
  const withTop = history
    .map((h) => ({ date: h.date, set: topSetOf(h.sets) }))
    .filter((h): h is { date: string; set: WorkoutSet } => h.set !== null)

  const recent = withTop.slice(-recentCount)

  const best = withTop.reduce<WorkoutSet | null>((acc, h) => {
    if (!acc) return h.set
    if (h.set.weightKg > acc.weightKg) return h.set
    if (h.set.weightKg === acc.weightKg && h.set.reps > acc.reps) return h.set
    return acc
  }, null)

  // Epley formula; only shown for rep ranges where the estimate stays reasonably reliable.
  const estimated1RM = best && best.reps > 0 && best.reps <= 12 ? round(best.weightKg * (1 + best.reps / 30), 1) : null

  return { recent, best, estimated1RM }
}

export function compareBestSets(a: WorkoutSet | null, b: WorkoutSet | null): 'up' | 'steady' | 'down' | null {
  if (!a || !b) return null
  if (a.weightKg > b.weightKg) return 'up'
  if (a.weightKg < b.weightKg) return 'down'
  if (a.reps > b.reps) return 'up'
  if (a.reps < b.reps) return 'down'
  return 'steady'
}

// ---- Consistency ----

export interface ConsistencySummary {
  completedThisMonth: number
  weeklyAverageLast4Weeks: number
  totalCompleted: number
}

export function summarizeConsistency(
  allSessions: { date: string }[],
  today: string,
): ConsistencySummary {
  const monthStart = startOfMonthLocal(today)
  const completedThisMonth = allSessions.filter((s) => s.date >= monthStart && s.date <= today).length

  const fourWeeksAgo = addDays(today, -27)
  const last4Weeks = allSessions.filter((s) => s.date >= fourWeeksAgo && s.date <= today).length

  return {
    completedThisMonth,
    weeklyAverageLast4Weeks: round(last4Weeks / 4, 1),
    totalCompleted: allSessions.length,
  }
}

// ---- Nutrition ----

export interface NutritionSummary {
  avgCalories: number | null
  avgProtein: number | null
  daysLogged: number
}

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function summarizeNutrition(logs: NutritionLog[]): NutritionSummary {
  const calorieValues = logs.map((l) => l.calories).filter((v): v is number => v !== undefined)
  const proteinValues = logs.map((l) => l.proteinG).filter((v): v is number => v !== undefined)

  return {
    avgCalories: calorieValues.length ? Math.round(mean(calorieValues)) : null,
    avgProtein: proteinValues.length ? Math.round(mean(proteinValues)) : null,
    daysLogged: logs.length,
  }
}
