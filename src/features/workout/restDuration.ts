import type { ExerciseCategory } from '../../db/types'

/** Sensible defaults: heavy compound work needs longer rest, isolation/cardio shorter. */
export function restSecondsFor(category: ExerciseCategory | undefined): number {
  switch (category) {
    case 'compound':
      return 120
    case 'isolation':
      return 75
    case 'cardio':
    case 'mobility':
      return 45
    default:
      return 90
  }
}
