import type { SessionTemplate, SessionTemplateKey } from './types'

/**
 * A small, fixed set of session templates (doc/phase-5-planner.md #7). Each template describes
 * the INTENT of a session (which movement patterns / muscles to hit, roughly how heavy) — the
 * planner picks actual exercises from the library at generation time (see exerciseSelection.ts).
 */
export const TEMPLATES: Record<SessionTemplateKey, SessionTemplate> = {
  upper_strength: {
    key: 'upper_strength',
    label: 'Upper Strength',
    region: 'upper',
    focus: 'strength',
    primarySlots: [
      { movementPatterns: ['push'], targetSets: 4, minReps: 5, maxReps: 8, targetRIR: 2, restSeconds: 150 },
      { movementPatterns: ['pull'], targetSets: 4, minReps: 5, maxReps: 8, targetRIR: 2, restSeconds: 150 },
    ],
    secondarySlots: [
      { primaryMuscles: ['shoulders'], targetSets: 3, minReps: 8, maxReps: 12, targetRIR: 2, restSeconds: 75 },
      { primaryMuscles: ['biceps', 'triceps'], targetSets: 3, minReps: 10, maxReps: 12, targetRIR: 2, restSeconds: 60 },
    ],
    athleticComponent: { label: 'Short Conditioning', estimatedMinutes: 10 },
  },

  lower_strength: {
    key: 'lower_strength',
    label: 'Lower Strength',
    region: 'lower',
    focus: 'strength',
    primarySlots: [
      { movementPatterns: ['squat'], targetSets: 4, minReps: 5, maxReps: 8, targetRIR: 2, restSeconds: 150 },
      { movementPatterns: ['hinge'], targetSets: 4, minReps: 5, maxReps: 8, targetRIR: 2, restSeconds: 150 },
    ],
    secondarySlots: [
      { primaryMuscles: ['hamstrings', 'quads'], targetSets: 3, minReps: 10, maxReps: 12, targetRIR: 2, restSeconds: 75 },
      { primaryMuscles: ['core'], targetSets: 3, minReps: 10, maxReps: 15, targetRIR: 2, restSeconds: 60 },
    ],
    // No athletic add-on by default: protects recovery after heavy lower-body compound work.
  },

  upper_hypertrophy: {
    key: 'upper_hypertrophy',
    label: 'Upper Hypertrophy',
    region: 'upper',
    focus: 'hypertrophy',
    primarySlots: [
      { movementPatterns: ['push'], targetSets: 3, minReps: 8, maxReps: 12, targetRIR: 2, restSeconds: 90 },
      { movementPatterns: ['pull'], targetSets: 3, minReps: 8, maxReps: 12, targetRIR: 2, restSeconds: 90 },
    ],
    secondarySlots: [
      { primaryMuscles: ['shoulders'], targetSets: 3, minReps: 10, maxReps: 15, targetRIR: 2, restSeconds: 60 },
      { primaryMuscles: ['biceps', 'triceps'], targetSets: 3, minReps: 10, maxReps: 15, targetRIR: 2, restSeconds: 60 },
    ],
    athleticComponent: { label: 'Cardio', estimatedMinutes: 15 },
  },

  lower_hypertrophy: {
    key: 'lower_hypertrophy',
    label: 'Lower Hypertrophy',
    region: 'lower',
    focus: 'hypertrophy',
    primarySlots: [
      { movementPatterns: ['squat'], targetSets: 3, minReps: 10, maxReps: 12, targetRIR: 2, restSeconds: 90 },
      { movementPatterns: ['hinge'], targetSets: 3, minReps: 10, maxReps: 12, targetRIR: 2, restSeconds: 90 },
    ],
    secondarySlots: [
      { primaryMuscles: ['glutes', 'hamstrings', 'quads'], targetSets: 3, minReps: 12, maxReps: 15, targetRIR: 2, restSeconds: 60 },
      { primaryMuscles: ['calves'], targetSets: 3, minReps: 12, maxReps: 15, targetRIR: 2, restSeconds: 45 },
    ],
    athleticComponent: { label: 'Conditioning', estimatedMinutes: 12 },
  },

  full_body: {
    key: 'full_body',
    label: 'Full Body',
    region: 'full',
    focus: 'strength',
    primarySlots: [
      { movementPatterns: ['squat'], targetSets: 3, minReps: 6, maxReps: 10, targetRIR: 2, restSeconds: 120 },
      { movementPatterns: ['push'], targetSets: 3, minReps: 6, maxReps: 10, targetRIR: 2, restSeconds: 120 },
      { movementPatterns: ['pull'], targetSets: 3, minReps: 6, maxReps: 10, targetRIR: 2, restSeconds: 120 },
    ],
    secondarySlots: [
      { primaryMuscles: ['core'], targetSets: 2, minReps: 10, maxReps: 15, targetRIR: 2, restSeconds: 60 },
    ],
  },

  conditioning: {
    key: 'conditioning',
    label: 'Conditioning',
    region: 'full',
    focus: 'conditioning',
    primarySlots: [],
    secondarySlots: [
      { primaryMuscles: ['core'], targetSets: 2, minReps: 12, maxReps: 15, targetRIR: 3, restSeconds: 45 },
    ],
    athleticComponent: { label: 'Conditioning', estimatedMinutes: 30 },
  },
}
