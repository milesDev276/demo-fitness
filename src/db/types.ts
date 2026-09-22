export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface UserProfile {
  id?: number
  age: number
  sex: 'male' | 'female' | 'other'
  heightCm: number
  weightKg: number
  experience: ExperienceLevel
  trainingDaysPerWeek: number
  sessionDurationMinutes: number
  goalMuscularEmphasis: number
  goalAthleticEmphasis: number
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

export interface WorkoutPlan {
  id?: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutSession {
  id?: number
  planId?: number
  date: string
  status: 'planned' | 'in_progress' | 'completed'
  notes?: string
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

export interface NutritionLog {
  id?: number
  date: string
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  notes?: string
}
