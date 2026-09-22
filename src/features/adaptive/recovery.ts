import type { RecoveryLevel, RecoverySignal } from './types'

/**
 * Scores each available signal as -1/0/+1 against the thresholds in doc/adaptive-rules.md.
 * "Good" requires every logged signal to be positive; "poor" requires at least two signals
 * to be negative, so a single bad metric never dominates the classification (see rule #9).
 */
export function classifyRecovery(recovery: RecoverySignal | null | undefined): RecoveryLevel {
  if (!recovery) return 'unknown'

  const scores: number[] = []
  if (recovery.sleepHours !== undefined) {
    scores.push(recovery.sleepHours >= 7 ? 1 : recovery.sleepHours < 6 ? -1 : 0)
  }
  if (recovery.energy !== undefined) {
    scores.push(recovery.energy >= 7 ? 1 : recovery.energy <= 4 ? -1 : 0)
  }
  if (recovery.soreness !== undefined) {
    scores.push(recovery.soreness <= 3 ? 1 : recovery.soreness >= 7 ? -1 : 0)
  }

  if (scores.length === 0) return 'unknown'

  const total = scores.reduce((sum, s) => sum + s, 0)
  if (total === scores.length) return 'good'
  if (total <= -2) return 'poor'
  return 'moderate'
}
