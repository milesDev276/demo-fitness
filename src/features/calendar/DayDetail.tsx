import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { formatShortDate, todayLocalDate } from '../../utils/date'
import { getActiveSession } from '../workout/repository'
import { ResetWorkoutMenu } from '../workout/ResetWorkoutMenu'
import { SessionExercises } from '../workout/SessionExercises'
import { startAndOpenWorkout } from '../workout/startWorkout'
import { useUiStore } from '../../store/useUiStore'
import type { CalendarDay } from './calendar'
import { isInPlannedWeek } from './repository'

const PRIMARY = 'mt-3 min-h-12 w-full rounded-xl bg-neutral-900 text-base font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900'

/** What happened, or is planned, on the selected date. Reads only — nothing here edits history. */
export function DayDetail({ date, day }: { date: string; day: CalendarDay | undefined }) {
  const today = todayLocalDate()
  const setActivePage = useUiStore((s) => s.setActivePage)
  const activeSession = useLiveQuery(async () => (await getActiveSession()) ?? null, [])
  const plannedWeek = useLiveQuery(() => isInPlannedWeek(date), [date])
  const exerciseNames = useLiveQuery(
    () => db.exercises.toArray().then((list) => new Map(list.map((e) => [e.id!, e.name]))),
    [],
  )

  const completed = day?.completed ?? []
  const scheduled = day?.scheduled ?? []
  const nothing = completed.length === 0 && scheduled.length === 0

  return (
    <section aria-live="polite" className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
        {formatShortDate(date)}
        {date === today && <span className="ml-2 rounded-full bg-neutral-900 px-2 py-0.5 align-middle text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">Today</span>}
      </h2>

      {completed.map((session) => (
        <article key={session.id} className="mt-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">{session.planName}</p>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Completed ✓{session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
              </p>
            </div>
            {/* Only today's workout can be undone; earlier days stay as permanent history. */}
            {session.date === today && (
              <div className="-mr-2 -mt-2">
                <ResetWorkoutMenu sessionId={session.id!} />
              </div>
            )}
          </div>
          <SessionExercises sessionId={session.id!} />
        </article>
      ))}

      {scheduled.map(({ plan, status }) => (
        <article key={plan.id} className="mt-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{plan.name}</p>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {status === 'missed' ? 'Missed' : 'Planned'}
            {plan.estimatedDurationMinutes ? ` · ~${plan.estimatedDurationMinutes} min` : ''}
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {plan.exercises
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((e) => exerciseNames?.get(e.exerciseId) ?? '…')
              .join(' · ')}
          </p>
          {activeSession ? (
            <button type="button" onClick={() => setActivePage('workout')} className={PRIMARY}>
              {activeSession.planId === plan.id ? 'Continue Workout' : 'Finish your current workout first'}
            </button>
          ) : (
            <button type="button" onClick={() => startAndOpenWorkout(plan)} className={PRIMARY}>
              {plan.scheduledDate! > today ? 'Start Early' : 'Start Workout'}
            </button>
          )}
        </article>
      ))}

      {nothing && plannedWeek !== undefined && (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          {plannedWeek ? 'Rest day.' : date >= today ? 'No workout planned for this day.' : 'No workout on this day.'}
        </p>
      )}
    </section>
  )
}
