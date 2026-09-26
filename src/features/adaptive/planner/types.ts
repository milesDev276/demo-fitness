import type { EquipmentAccess, Exercise, ExperienceLevel, MovementPattern, PlannedExercise } from '../../../db/types'
import type { RecoveryLevel, RecoverySignal } from '../types'

export type TrainingRegion = 'upper' | 'lower' | 'full'
export type TrainingFocus = 'strength' | 'hypertrophy' | 'conditioning'

export type SessionTemplateKey =
  | 'upper_strength'
  | 'lower_strength'
  | 'upper_hypertrophy'
  | 'lower_hypertrophy'
  | 'full_body'
  | 'conditioning'

export interface TemplateSlot {
  movementPatterns?: MovementPattern[]
  primaryMuscles?: string[]
  targetSets: number
  minReps: number
  maxReps: number
  targetRIR: number
  restSeconds: number
}

export interface AthleticComponent {
  label: string
  estimatedMinutes: number
}

export interface SessionTemplate {
  key: SessionTemplateKey
  label: string
  region: TrainingRegion
  focus: TrainingFocus
  primarySlots: TemplateSlot[]
  secondarySlots: TemplateSlot[]
  athleticComponent?: AthleticComponent
}

export interface PlannerHistorySet {
  exerciseId: number
  weightKg: number
  reps: number
  rir?: number
}

export interface PlannerHistorySession {
  date: string
  sets: PlannerHistorySet[]
}

/** Which Monday-started week to plan: the remaining days of the current week, or the following week. */
export type PlanTarget = 'this' | 'next'

export interface WeeklyPlannerInput {
  /** Local ISO date (yyyy-mm-dd) "today" is generated relative to. */
  today: string
  /** Defaults to 'next'. 'this' only schedules days from today onward. */
  planFor?: PlanTarget
  /** 0 = Sunday .. 6 = Saturday. */
  availableDays: number[]
  trainingDaysPerWeek: number
  sessionDurationMinutes: number
  goalMuscularEmphasis: number
  goalAthleticEmphasis: number
  experience: ExperienceLevel
  equipment: EquipmentAccess[]
  exercises: Exercise[]
  /** Completed sessions from roughly the last 3 weeks, most recent last. */
  recentSessions: PlannerHistorySession[]
  /** Exercise ids used in the most recently generated week, for consistency preference. */
  previousPlanExerciseIds: number[]
  recovery: RecoverySignal | null
}

export interface GeneratedDayPlan {
  date: string
  dayOfWeek: number
  templateKey: SessionTemplateKey
  templateLabel: string
  name: string
  exercises: PlannedExercise[]
  estimatedDurationMinutes: number
  athleticLabel: string | null
  notes: string[]
}

export interface GeneratedWeekPlan {
  planFor: PlanTarget
  weekStart: string
  weekEnd: string
  requestedSessions: number
  availableDayCount: number
  days: GeneratedDayPlan[]
  explanation: string[]
  recoveryLevel: RecoveryLevel
  basedOnLimitedHistory: boolean
}
