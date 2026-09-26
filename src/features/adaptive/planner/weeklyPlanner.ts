import type { PlannedExercise } from '../../../db/types'
import { addDays, mondayOnOrBefore } from '../../../utils/date'
import { classifyRecovery } from '../recovery'
import type { RecoveryLevel } from '../types'
import { selectSpacedItems, mondayFirstIndex } from './availability'
import { estimateResistanceMinutes, roundMinutes } from './duration'
import { selectExerciseForSlot, toPlannedExercise } from './exerciseSelection'
import { computeRecentRegionVolume, needierRegion } from './muscleVolume'
import { TEMPLATES } from './templates'
import type {
  GeneratedDayPlan,
  GeneratedWeekPlan,
  SessionTemplate,
  SessionTemplateKey,
  TemplateSlot,
  TrainingFocus,
  TrainingRegion,
  WeeklyPlannerInput,
} from './types'

const MIN_SET_COUNT = 2
/** Small tolerance so a session that's a couple minutes over budget isn't rejected outright. */
const DURATION_TOLERANCE_MINUTES = 10
const LIMITED_HISTORY_SESSION_THRESHOLD = 3
/** Only swap in a dedicated conditioning day when there's room beyond a normal 4-day upper/lower split. */
const CONDITIONING_DAY_MIN_SESSIONS = 5
const CONDITIONING_DAY_ATHLETIC_THRESHOLD = 0.6

function reduceSets(slot: TemplateSlot): TemplateSlot {
  return { ...slot, targetSets: Math.max(MIN_SET_COUNT, slot.targetSets - 1) }
}

function applyRecoveryTrim(
  template: SessionTemplate,
  recoveryLevel: RecoveryLevel,
): { primarySlots: TemplateSlot[]; secondarySlots: TemplateSlot[] } {
  if (recoveryLevel === 'poor') {
    const trimmedSecondary = template.secondarySlots.slice(0, Math.max(1, template.secondarySlots.length - 1))
    return {
      primarySlots: template.primarySlots.map(reduceSets),
      secondarySlots: trimmedSecondary.map(reduceSets),
    }
  }
  if (recoveryLevel === 'moderate') {
    return { primarySlots: template.primarySlots, secondarySlots: template.secondarySlots.map(reduceSets) }
  }
  return { primarySlots: template.primarySlots, secondarySlots: template.secondarySlots }
}

function templateKeyForRegionFocus(region: 'upper' | 'lower', focus: TrainingFocus): SessionTemplateKey {
  if (region === 'upper') return focus === 'strength' ? 'upper_strength' : 'upper_hypertrophy'
  return focus === 'strength' ? 'lower_strength' : 'lower_hypertrophy'
}

/** Builds the day-by-day region sequence: alternates upper/lower starting with whichever needs more volume. */
function buildRegionSequence(count: number, needier: 'upper' | 'lower'): TrainingRegion[] {
  if (count <= 1) return count === 1 ? ['full'] : []
  const other: TrainingRegion = needier === 'upper' ? 'lower' : 'upper'
  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? needier : other))
}

function buildTemplateSequence(regions: TrainingRegion[], goalAthleticEmphasis: number): SessionTemplateKey[] {
  const occurrenceByRegion = new Map<TrainingRegion, number>()
  const keys = regions.map((region) => {
    const occurrence = occurrenceByRegion.get(region) ?? 0
    occurrenceByRegion.set(region, occurrence + 1)
    if (region === 'full') return 'full_body' as const
    const focus: TrainingFocus = occurrence % 2 === 0 ? 'strength' : 'hypertrophy'
    return templateKeyForRegionFocus(region, focus)
  })

  // High athletic emphasis with enough sessions: dedicate the last day to conditioning instead
  // of a repeated resistance session, rather than trying to interpret 50/50 as literal per-session.
  if (keys.length >= CONDITIONING_DAY_MIN_SESSIONS && goalAthleticEmphasis >= CONDITIONING_DAY_ATHLETIC_THRESHOLD) {
    keys[keys.length - 1] = 'conditioning'
  }

  return keys
}

function buildDayPlan(
  date: string,
  templateKey: SessionTemplateKey,
  input: WeeklyPlannerInput,
  recoveryLevel: RecoveryLevel,
  historyCountByExercise: Map<number, number>,
  preferredIds: Set<number>,
  regionVolume: { upper: number; lower: number },
): GeneratedDayPlan {
  const template = TEMPLATES[templateKey]
  const { primarySlots, secondarySlots } = applyRecoveryTrim(template, recoveryLevel)
  const allSlots = [...primarySlots, ...secondarySlots]

  const usedIds = new Set<number>()
  const exercises: PlannedExercise[] = []
  for (const slot of allSlots) {
    const exercise = selectExerciseForSlot(
      slot,
      input.exercises,
      usedIds,
      historyCountByExercise,
      preferredIds,
      input.equipment,
    )
    if (!exercise?.id) continue
    usedIds.add(exercise.id)
    exercises.push(toPlannedExercise(exercise, slot, exercises.length))
  }

  const resistanceMinutes = estimateResistanceMinutes(allSlots)

  const notes: string[] = []
  const wantsAthletic = input.goalAthleticEmphasis >= 0.25
  const isRecoveryPoor = recoveryLevel === 'poor'
  let athleticLabel: string | null = null
  let totalMinutes = resistanceMinutes

  if (template.athleticComponent && !isRecoveryPoor) {
    const withAthletic = resistanceMinutes + template.athleticComponent.estimatedMinutes
    const fitsBudget = withAthletic <= input.sessionDurationMinutes + DURATION_TOLERANCE_MINUTES
    if (template.key === 'conditioning' || (wantsAthletic && fitsBudget)) {
      athleticLabel = template.athleticComponent.label
      totalMinutes = withAthletic
      notes.push(`Includes ${template.athleticComponent.label.toLowerCase()} to support your athletic goal.`)
    }
  }

  if (recoveryLevel === 'poor' || recoveryLevel === 'moderate') {
    notes.push(`Volume trimmed slightly — recent recovery has been ${recoveryLevel}.`)
  }

  if (template.region !== 'full') {
    const otherRegion = template.region === 'upper' ? 'lower' : 'upper'
    const thisVolume = regionVolume[template.region]
    const otherVolume = regionVolume[otherRegion]
    if (thisVolume < otherVolume) {
      notes.push(`Balances against relatively higher recent ${otherRegion}-body volume.`)
    }
  }

  const dayOfWeek = new Date(`${date}T00:00:00`).getDay()

  return {
    date,
    dayOfWeek,
    templateKey,
    templateLabel: template.label,
    name: template.label,
    exercises,
    estimatedDurationMinutes: roundMinutes(totalMinutes),
    athleticLabel,
    notes,
  }
}

/**
 * Pure, deterministic function: same input always produces the same week (doc #32). Decides WHAT
 * to train and roughly HOW MUCH — actual set-by-set progression stays with the Phase 4 engine
 * (calculateNextExerciseTarget), which runs later when the user logs against these targets.
 */
export function generateWeeklyPlan(input: WeeklyPlannerInput): GeneratedWeekPlan {
  const weekStart = addDays(mondayOnOrBefore(input.today), 7)
  const weekEnd = addDays(weekStart, 6)
  const dateByWeekday = new Map<number, string>()
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    dateByWeekday.set(new Date(`${date}T00:00:00`).getDay(), date)
  }

  const orderedAvailable = Array.from(new Set(input.availableDays)).sort(
    (a, b) => mondayFirstIndex(a) - mondayFirstIndex(b),
  )
  const selectedWeekdays = selectSpacedItems(orderedAvailable, input.trainingDaysPerWeek)
  const selectedDates = selectedWeekdays.map((wd) => dateByWeekday.get(wd)!).sort()

  const recoveryLevel = classifyRecovery(input.recovery)
  const exercisesById = new Map(input.exercises.filter((e) => e.id !== undefined).map((e) => [e.id!, e]))
  const regionVolume = computeRecentRegionVolume(input.recentSessions, exercisesById)
  const needier = needierRegion(regionVolume)

  const regions = buildRegionSequence(selectedDates.length, needier)
  const templateKeys = buildTemplateSequence(regions, input.goalAthleticEmphasis)

  const historyCountByExercise = new Map<number, number>()
  for (const session of input.recentSessions) {
    for (const set of session.sets) {
      historyCountByExercise.set(set.exerciseId, (historyCountByExercise.get(set.exerciseId) ?? 0) + 1)
    }
  }
  const preferredIds = new Set(input.previousPlanExerciseIds)

  const days = selectedDates.map((date, i) =>
    buildDayPlan(date, templateKeys[i], input, recoveryLevel, historyCountByExercise, preferredIds, regionVolume),
  )

  const basedOnLimitedHistory = input.recentSessions.length < LIMITED_HISTORY_SESSION_THRESHOLD

  const explanation: string[] = []
  explanation.push(
    days.length < input.trainingDaysPerWeek
      ? `Only ${days.length} of your requested ${input.trainingDaysPerWeek} training days are available this week, so the plan has ${days.length} session${days.length === 1 ? '' : 's'}.`
      : `${days.length} training day${days.length === 1 ? '' : 's'} scheduled based on your availability.`,
  )
  if (regions.includes('upper') && regions.includes('lower')) {
    explanation.push('Upper and lower body training are balanced across the week.')
  }
  if (recoveryLevel === 'poor' || recoveryLevel === 'moderate') {
    explanation.push(`Recent recovery has been ${recoveryLevel}, so volume and conditioning were adjusted accordingly.`)
  }
  if (days.some((d) => d.athleticLabel)) {
    explanation.push('Both resistance training and athletic conditioning are included to match your goal balance.')
  }
  if (basedOnLimitedHistory) {
    explanation.push(
      'This plan is based mainly on your current goals and availability. As you complete more workouts, FitFlow can personalize future plans using your performance and recovery history.',
    )
  }

  return {
    weekStart,
    weekEnd,
    requestedSessions: input.trainingDaysPerWeek,
    availableDayCount: input.availableDays.length,
    days,
    explanation,
    recoveryLevel,
    basedOnLimitedHistory,
  }
}
