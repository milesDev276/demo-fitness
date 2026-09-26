/** Fixed warm-up allowance — not logged as detailed sets in MVP (doc #18). */
const WARMUP_MINUTES = 8
/** Rough time to actually perform one working set, independent of rest. */
const SET_EXECUTION_SECONDS = 45
/** Walking to/loading a new station between exercises — real gym overhead the per-set math misses. */
const EXERCISE_TRANSITION_SECONDS = 90

export interface DurationInput {
  targetSets: number
  restSeconds: number
}

/** Simple, not scientifically precise — just enough to keep sessions realistic (doc #19). */
export function estimateResistanceMinutes(slots: DurationInput[]): number {
  const workSeconds = slots.reduce(
    (sum, slot) => sum + slot.targetSets * (SET_EXECUTION_SECONDS + slot.restSeconds) + EXERCISE_TRANSITION_SECONDS,
    0,
  )
  return WARMUP_MINUTES + workSeconds / 60
}

export function roundMinutes(value: number): number {
  return Math.round(value)
}
