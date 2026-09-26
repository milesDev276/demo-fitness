import Dexie, { type EntityTable } from 'dexie'
import { exerciseSeed } from '../data/exercises'
import type {
  BodyLog,
  BodyPhoto,
  DailyCheckIn,
  Exercise,
  NutritionLog,
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
  WorkoutSet,
} from './types'

export class FitFlowDatabase extends Dexie {
  userProfile!: EntityTable<UserProfile, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  workoutPlans!: EntityTable<WorkoutPlan, 'id'>
  workoutSessions!: EntityTable<WorkoutSession, 'id'>
  workoutSets!: EntityTable<WorkoutSet, 'id'>
  bodyLogs!: EntityTable<BodyLog, 'id'>
  dailyCheckIns!: EntityTable<DailyCheckIn, 'id'>
  nutritionLogs!: EntityTable<NutritionLog, 'id'>
  bodyPhotos!: EntityTable<BodyPhoto, 'id'>

  constructor() {
    super('fitflow')

    this.version(1).stores({
      userProfile: '++id',
      exercises: '++id, name, category, equipment, primaryMuscle, movementPattern, isBodyweight',
      workoutPlans: '++id, name, createdAt',
      workoutSessions: '++id, planId, date, status',
      workoutSets: '++id, sessionId, exerciseId',
      bodyLogs: '++id, date',
      dailyCheckIns: '++id, date',
      nutritionLogs: '++id, date',
    })

    // Phase 5: index weekStart/scheduledDate so the weekly planner can look up generated plans.
    this.version(2).stores({
      workoutPlans: '++id, name, createdAt, weekStart, scheduledDate',
    })

    // Phase 6: body progress photos.
    this.version(3).stores({
      bodyPhotos: '++id, date, category',
    })

    this.on('populate', () => {
      this.exercises.bulkAdd(exerciseSeed)
    })
  }
}

export const db = new FitFlowDatabase()
