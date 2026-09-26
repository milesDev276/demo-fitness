import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, todayLocalDate } from '../../utils/date'
import { buildTrendSummary, compareBestSets, summarizeNutrition, summarizeStrength } from './calculations'
import {
  getSetsForExercise,
  listBodyLogsSince,
  listCheckInsSince,
  listCompletedSessionsSince,
  listExercisesWithHistory,
  listNutritionLogsSince,
} from './repository'

const ARROW: Record<'up' | 'steady' | 'down', string> = { up: '↑', steady: '→', down: '↓' }

export function WeeklySummaryCard() {
  const today = todayLocalDate()
  const weekStart = useMemo(() => addDays(today, -6), [today])

  const sessions = useLiveQuery(() => listCompletedSessionsSince(weekStart), [weekStart])
  const bodyLogs = useLiveQuery(() => listBodyLogsSince(weekStart), [weekStart])
  const nutritionLogs = useLiveQuery(() => listNutritionLogsSince(weekStart), [weekStart])
  const checkIns = useLiveQuery(() => listCheckInsSince(weekStart), [weekStart])
  const exercises = useLiveQuery(() => listExercisesWithHistory(), [])

  const weightSummary = useMemo(
    () => (bodyLogs ? buildTrendSummary(bodyLogs.map((l) => ({ date: l.date, value: l.weightKg }))) : null),
    [bodyLogs],
  )

  const nutritionSummary = useMemo(
    () => (nutritionLogs ? summarizeNutrition(nutritionLogs) : null),
    [nutritionLogs],
  )

  const avgSleep = useMemo(() => {
    if (!checkIns) return null
    const values = checkIns.map((c) => c.sleepHours).filter((v): v is number => v !== undefined)
    if (values.length === 0) return null
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  }, [checkIns])

  const trainedThisWeek = useMemo(
    () =>
      exercises
        ?.filter((e) => e.category !== 'cardio' && e.lastDate >= weekStart)
        .sort((a, b) => b.sessionCount - a.sessionCount)[0] ?? null,
    [exercises, weekStart],
  )

  const highlightHistory = useLiveQuery(
    () => (trainedThisWeek ? getSetsForExercise(trainedThisWeek.exerciseId) : Promise.resolve(null)),
    [trainedThisWeek],
  )

  const strengthTrend = useMemo(() => {
    if (!highlightHistory) return null
    const thisWeek = highlightHistory.filter((h) => h.date >= weekStart)
    const before = highlightHistory.filter((h) => h.date < weekStart)
    const bestThisWeek = summarizeStrength(thisWeek).best
    const bestBefore = summarizeStrength(before).best
    return compareBestSets(bestThisWeek, bestBefore)
  }, [highlightHistory, weekStart])

  const hasAnyData =
    (sessions && sessions.length > 0) ||
    (weightSummary && weightSummary.points.length > 0) ||
    (nutritionSummary && nutritionSummary.daysLogged > 0) ||
    avgSleep !== null ||
    trainedThisWeek

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">This week</h3>

      {!hasAnyData ? (
        <p className="mt-3 text-sm text-neutral-500">
          Not enough data yet this week. Keep logging to see your weekly summary.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {sessions && sessions.length > 0 && (
            <SummaryRow label="Workout" value={`${sessions.length} session${sessions.length === 1 ? '' : 's'}`} />
          )}

          {weightSummary && weightSummary.latest !== null && (
            <SummaryRow
              label="Weight"
              value={`${weightSummary.latest} kg`}
              sub={
                weightSummary.change !== null
                  ? `${weightSummary.change > 0 ? '+' : ''}${weightSummary.change} kg`
                  : undefined
              }
            />
          )}

          {nutritionSummary && nutritionSummary.avgProtein !== null && (
            <SummaryRow label="Protein" value={`${nutritionSummary.avgProtein}g average`} />
          )}

          {trainedThisWeek && (
            <SummaryRow
              label="Strength"
              value={`${trainedThisWeek.name}${strengthTrend ? ` ${ARROW[strengthTrend]}` : ''}`}
            />
          )}

          {avgSleep !== null && <SummaryRow label="Recovery" value={`Average sleep: ${avgSleep}h`} />}
        </div>
      )}
    </section>
  )
}

function SummaryRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <p className="text-xs uppercase text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
        {value}
        {sub && <span className="ml-1.5 font-normal text-neutral-500">{sub}</span>}
      </p>
    </div>
  )
}
