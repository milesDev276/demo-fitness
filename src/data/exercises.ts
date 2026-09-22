import type { Exercise } from '../db/types'

export const exerciseSeed: Exercise[] = [
  // Compound — push
  { name: 'Barbell Bench Press', category: 'compound', equipment: 'barbell', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', isBodyweight: false },
  { name: 'Incline Dumbbell Press', category: 'compound', equipment: 'dumbbell', primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], movementPattern: 'push', isBodyweight: false },
  { name: 'Overhead Press', category: 'compound', equipment: 'barbell', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], movementPattern: 'push', isBodyweight: false },
  { name: 'Dumbbell Shoulder Press', category: 'compound', equipment: 'dumbbell', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], movementPattern: 'push', isBodyweight: false },
  { name: 'Dip', category: 'compound', equipment: 'bodyweight', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', isBodyweight: true },
  { name: 'Push-up', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], movementPattern: 'push', isBodyweight: true },

  // Compound — pull
  { name: 'Deadlift', category: 'compound', equipment: 'barbell', primaryMuscle: 'back', secondaryMuscles: ['hamstrings', 'glutes'], movementPattern: 'hinge', isBodyweight: false },
  { name: 'Pull-up', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: true },
  { name: 'Chin-up', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: true },
  { name: 'Lat Pulldown', category: 'compound', equipment: 'cable', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: false },
  { name: 'Barbell Row', category: 'compound', equipment: 'barbell', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'shoulders'], movementPattern: 'pull', isBodyweight: false },
  { name: 'Seated Cable Row', category: 'compound', equipment: 'cable', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: false },
  { name: 'Dumbbell Row', category: 'compound', equipment: 'dumbbell', primaryMuscle: 'back', secondaryMuscles: ['biceps'], movementPattern: 'pull', isBodyweight: false },

  // Compound — squat / lunge
  { name: 'Back Squat', category: 'compound', equipment: 'barbell', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], movementPattern: 'squat', isBodyweight: false },
  { name: 'Front Squat', category: 'compound', equipment: 'barbell', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'core'], movementPattern: 'squat', isBodyweight: false },
  { name: 'Leg Press', category: 'compound', equipment: 'machine', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], movementPattern: 'squat', isBodyweight: false },
  { name: 'Bulgarian Split Squat', category: 'compound', equipment: 'dumbbell', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'lunge', isBodyweight: false },
  { name: 'Walking Lunge', category: 'compound', equipment: 'dumbbell', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], movementPattern: 'lunge', isBodyweight: false },
  { name: 'Bodyweight Squat', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], movementPattern: 'squat', isBodyweight: true },
  { name: 'Romanian Deadlift', category: 'compound', equipment: 'barbell', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back'], movementPattern: 'hinge', isBodyweight: false },
  { name: 'Hip Thrust', category: 'compound', equipment: 'barbell', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], movementPattern: 'hinge', isBodyweight: false },

  // Isolation
  { name: 'Dumbbell Bicep Curl', category: 'isolation', equipment: 'dumbbell', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'pull', isBodyweight: false },
  { name: 'Barbell Bicep Curl', category: 'isolation', equipment: 'barbell', primaryMuscle: 'biceps', secondaryMuscles: [], movementPattern: 'pull', isBodyweight: false },
  { name: 'Triceps Pushdown', category: 'isolation', equipment: 'cable', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'push', isBodyweight: false },
  { name: 'Overhead Triceps Extension', category: 'isolation', equipment: 'dumbbell', primaryMuscle: 'triceps', secondaryMuscles: [], movementPattern: 'push', isBodyweight: false },
  { name: 'Lateral Raise', category: 'isolation', equipment: 'dumbbell', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'push', isBodyweight: false },
  { name: 'Rear Delt Fly', category: 'isolation', equipment: 'dumbbell', primaryMuscle: 'shoulders', secondaryMuscles: ['back'], movementPattern: 'pull', isBodyweight: false },
  { name: 'Leg Extension', category: 'isolation', equipment: 'machine', primaryMuscle: 'quads', secondaryMuscles: [], movementPattern: 'squat', isBodyweight: false },
  { name: 'Leg Curl', category: 'isolation', equipment: 'machine', primaryMuscle: 'hamstrings', secondaryMuscles: [], movementPattern: 'hinge', isBodyweight: false },
  { name: 'Calf Raise', category: 'isolation', equipment: 'machine', primaryMuscle: 'calves', secondaryMuscles: [], movementPattern: 'squat', isBodyweight: false },
  { name: 'Cable Crunch', category: 'isolation', equipment: 'cable', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'rotation', isBodyweight: false },
  { name: 'Chest Fly', category: 'isolation', equipment: 'cable', primaryMuscle: 'chest', secondaryMuscles: [], movementPattern: 'push', isBodyweight: false },
  { name: 'Face Pull', category: 'isolation', equipment: 'cable', primaryMuscle: 'shoulders', secondaryMuscles: ['back'], movementPattern: 'pull', isBodyweight: false },

  // Bodyweight / core
  { name: 'Plank', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'carry', isBodyweight: true },
  { name: 'Hanging Leg Raise', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'rotation', isBodyweight: true },
  { name: 'Sit-up', category: 'bodyweight', equipment: 'bodyweight', primaryMuscle: 'core', secondaryMuscles: [], movementPattern: 'rotation', isBodyweight: true },
  { name: 'Farmer Carry', category: 'compound', equipment: 'dumbbell', primaryMuscle: 'core', secondaryMuscles: ['back', 'shoulders'], movementPattern: 'carry', isBodyweight: false },

  // Cardio / conditioning
  { name: 'Treadmill Run', category: 'cardio', equipment: 'machine', primaryMuscle: 'cardio', secondaryMuscles: ['quads', 'hamstrings'], movementPattern: 'locomotion', isBodyweight: false },
  { name: 'Outdoor Run', category: 'cardio', equipment: 'none', primaryMuscle: 'cardio', secondaryMuscles: ['quads', 'hamstrings'], movementPattern: 'locomotion', isBodyweight: true },
  { name: 'Stationary Bike', category: 'cardio', equipment: 'machine', primaryMuscle: 'cardio', secondaryMuscles: ['quads'], movementPattern: 'locomotion', isBodyweight: false },
  { name: 'Rowing Machine', category: 'cardio', equipment: 'machine', primaryMuscle: 'cardio', secondaryMuscles: ['back', 'legs'], movementPattern: 'locomotion', isBodyweight: false },
  { name: 'Jump Rope', category: 'cardio', equipment: 'jump-rope', primaryMuscle: 'cardio', secondaryMuscles: ['calves'], movementPattern: 'locomotion', isBodyweight: true },
  { name: 'Battle Ropes', category: 'cardio', equipment: 'battle-ropes', primaryMuscle: 'cardio', secondaryMuscles: ['shoulders', 'core'], movementPattern: 'push', isBodyweight: false },
  { name: 'Assault Bike Intervals', category: 'cardio', equipment: 'machine', primaryMuscle: 'cardio', secondaryMuscles: ['legs', 'shoulders'], movementPattern: 'locomotion', isBodyweight: false },
  { name: 'Kettlebell Swing', category: 'compound', equipment: 'kettlebell', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings', 'cardio'], movementPattern: 'hinge', isBodyweight: false },

  // Mobility
  { name: "World's Greatest Stretch", category: 'mobility', equipment: 'bodyweight', primaryMuscle: 'hips', secondaryMuscles: ['thoracic spine'], movementPattern: 'rotation', isBodyweight: true },
  { name: 'Cat-Cow', category: 'mobility', equipment: 'bodyweight', primaryMuscle: 'spine', secondaryMuscles: [], movementPattern: 'rotation', isBodyweight: true },
  { name: '90/90 Hip Stretch', category: 'mobility', equipment: 'bodyweight', primaryMuscle: 'hips', secondaryMuscles: [], movementPattern: 'rotation', isBodyweight: true },
  { name: 'Shoulder Dislocate', category: 'mobility', equipment: 'band', primaryMuscle: 'shoulders', secondaryMuscles: [], movementPattern: 'rotation', isBodyweight: true },
]
