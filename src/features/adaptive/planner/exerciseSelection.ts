import type { EquipmentAccess, Exercise, PlannedExercise } from '../../../db/types'
import type { TemplateSlot } from './types'

/** Rough equipment an exerciser actually has access to under each broad category. */
const EQUIPMENT_BY_ACCESS: Record<EquipmentAccess, Set<string>> = {
  gym: new Set(['barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'bodyweight', 'band', 'jump-rope', 'battle-ropes', 'none']),
  home: new Set(['dumbbell', 'bodyweight', 'band', 'jump-rope', 'kettlebell', 'none']),
  bodyweight: new Set(['bodyweight', 'none']),
}

export function isExerciseUsable(exercise: Exercise, access: EquipmentAccess[]): boolean {
  return access.some((a) => EQUIPMENT_BY_ACCESS[a].has(exercise.equipment))
}

/**
 * Picks the best exercise for a slot: prefers one already used in last week's generated plan
 * (consistency, doc #17), then the one with the most recent history (familiarity), then falls
 * back to library order for determinism. Never invents an exercise or picks one twice per session.
 * Only considers exercises usable with the user's configured equipment access (doc #6).
 */
export function selectExerciseForSlot(
  slot: TemplateSlot,
  exercises: Exercise[],
  usedIds: Set<number>,
  historyCountByExercise: Map<number, number>,
  preferredIds: Set<number>,
  equipmentAccess: EquipmentAccess[],
): Exercise | null {
  const candidates = exercises.filter((e) => {
    if (e.id === undefined || usedIds.has(e.id)) return false
    if (slot.movementPatterns && !slot.movementPatterns.includes(e.movementPattern)) return false
    if (slot.primaryMuscles && !slot.primaryMuscles.includes(e.primaryMuscle)) return false
    if (!isExerciseUsable(e, equipmentAccess)) return false
    return true
  })

  if (candidates.length === 0) return null

  const sorted = [...candidates].sort((a, b) => {
    const preferredDiff = Number(preferredIds.has(b.id!)) - Number(preferredIds.has(a.id!))
    if (preferredDiff !== 0) return preferredDiff
    const historyDiff = (historyCountByExercise.get(b.id!) ?? 0) - (historyCountByExercise.get(a.id!) ?? 0)
    if (historyDiff !== 0) return historyDiff
    return a.id! - b.id!
  })

  return sorted[0]
}

export function toPlannedExercise(exercise: Exercise, slot: TemplateSlot, order: number): PlannedExercise {
  return {
    exerciseId: exercise.id!,
    order,
    targetSets: slot.targetSets,
    minReps: slot.minReps,
    maxReps: slot.maxReps,
    targetRIR: slot.targetRIR,
  }
}
