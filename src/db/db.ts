import Dexie, { type EntityTable } from 'dexie'
import { exerciseSeed } from '../data/exercises'
import type {
  BodyLog,
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

    this.on('populate', () => {
      this.exercises.bulkAdd(exerciseSeed)
    })
  }
}

export const db = new FitFlowDatabase()
