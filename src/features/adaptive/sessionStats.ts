import type { ExerciseSessionPerformance } from './types'

export interface SessionStats {
  date: string
  setCount: number
  avgReps: number
  avgRir: number | null
  reachedUpperRepTarget: boolean
  topWeightKg: number
}

export function computeSessionStats(session: ExerciseSessionPerformance, maxReps: number): SessionStats {
  const { sets } = session
  const rirValues = sets.map((s) => s.rir).filter((r): r is number => r !== undefined)

  return {
    date: session.date,
    setCount: sets.length,
    avgReps: sets.length ? sets.reduce((sum, s) => sum + s.reps, 0) / sets.length : 0,
    avgRir: rirValues.length ? rirValues.reduce((sum, r) => sum + r, 0) / rirValues.length : null,
    reachedUpperRepTarget: sets.length > 0 && sets.every((s) => s.reps >= maxReps),
    topWeightKg: sets.reduce((max, s) => Math.max(max, s.weightKg), 0),
  }
}
