export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type EquipmentAccess = 'gym' | 'home' | 'bodyweight'

export interface UserProfile {
  id?: number
  age: number
  sex: 'male' | 'female' | 'other'
  heightCm: number
  /** Starting/baseline weight only. Once a BodyLog exists, the latest BodyLog entry is the source of truth for current weight — see body/repository.ts#getCurrentWeightKg. */
  weightKg: number
  experience: ExperienceLevel
  trainingDaysPerWeek: number
  sessionDurationMinutes: number
  goalMuscularEmphasis: number
  goalAthleticEmphasis: number
  /** Days the user can train this week. 0 = Sunday .. 6 = Saturday (matches Date#getDay). */
  availableDays: number[]
  /** Where the user can train; the weekly planner only selects exercises usable with one of these. */
  equipment: EquipmentAccess[]
  calorieTarget?: number
  proteinTarget?: number
  carbTarget?: number
  fatTarget?: number
  createdAt: string
  updatedAt: string
}

export type ExerciseCategory = 'compound' | 'isolation' | 'bodyweight' | 'cardio' | 'mobility'

export type MovementPattern =
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'carry'
  | 'rotation'
  | 'locomotion'

export interface Exercise {
  id?: number
  name: string
  category: ExerciseCategory
  equipment: string
  primaryMuscle: string
  secondaryMuscles: string[]
  movementPattern: MovementPattern
  isBodyweight: boolean
}

export interface PlannedExercise {
  exerciseId: number
  order: number
  targetSets: number
  minReps: number
  maxReps: number
  targetRIR: number
}

export interface WorkoutPlan {
  id?: number
  name: string
  exercises: PlannedExercise[]
  createdAt: string
  updatedAt: string
  /** Set on plans produced by the weekly planner (Phase 5); absent on manually created plans. */
  isGenerated?: boolean
  /** Session template this plan was generated from, e.g. 'upper_strength'. */
  templateKey?: string
  /** Calendar date (local, ISO yyyy-mm-dd) this plan is scheduled for. */
  scheduledDate?: string
  /** Monday (local, ISO yyyy-mm-dd) of the week this plan belongs to. */
  weekStart?: string
  estimatedDurationMinutes?: number
  /** Short planner-generated explanation for why this session looks the way it does. */
  planningReason?: string
}

export interface WorkoutSession {
  id?: number
  planId: number
  planName: string
  date: string
  startTime: string
  endTime?: string
  durationMinutes?: number
  status: 'in_progress' | 'completed'
}

export interface WorkoutSet {
  id?: number
  sessionId: number
  exerciseId: number
  setNumber: number
  weightKg: number
  reps: number
  rir?: number
}

export interface BodyLog {
  id?: number
  date: string
  weightKg?: number
  waistCm?: number
}

export interface DailyCheckIn {
  id?: number
  date: string
  sleepHours?: number
  energy?: number
  soreness?: number
}

export interface Meal {
  id: string
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface NutritionLog {
  id?: number
  date: string
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  meals?: Meal[]
  notes?: string
}

export type PhotoCategory = 'front' | 'side' | 'back'

export interface BodyPhoto {
  id?: number
  date: string
  category: PhotoCategory
  /** Already downscaled client-side before storage — see features/photos/repository.ts. */
  blob: Blob
  createdAt: string
}
