/** "60kg × 8" for loaded sets, "8 reps" for unweighted ones (bodyweight work logged at 0 kg). */
export function formatSet(weightKg: number, reps: number): string {
  return weightKg > 0 ? `${weightKg}kg × ${reps}` : `${reps} reps`
}
