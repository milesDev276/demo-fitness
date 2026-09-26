import { useLiveQuery } from 'dexie-react-hooks'
import { todayLocalDate } from '../../utils/date'
import { safely } from '../../utils/safely'
import { useUiStore } from '../../store/useUiStore'
import { getActiveSession, getPlanForDate, getSessionSummary, getSessionsForDate, startSession } from './repository'

export function TodayWorkoutCard() {
  const today = todayLocalDate()
  const setActivePage = useUiStore((s) => s.setActivePage)

  const activeSession = useLiveQuery(() => getActiveSession(), [])
  const todaySessions = useLiveQuery(() => getSessionsForDate(today), [today])
  const plan = useLiveQuery(() => getPlanForDate(today), [today])

  const completedToday = todaySessions?.find((s) => s.status === 'completed')
  const summary = useLiveQuery(
    () => (completedToday ? getSessionSummary(completedToday.id!) : Promise.resolve(null)),
    [completedToday?.id],
  )

  async function handleStart() {
    if (!plan) return
    if (await safely(() => startSession(plan), "We couldn't start this workout. Please try again.")) {
      setActivePage('workout')
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Workout</h2>

      {completedToday ? (
        <div className="mt-2">
          <p className="text-lg font-semibold text-green-600 dark:text-green-500">✓ Workout completed</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{completedToday.planName}</p>
          {summary && (
            <div className="mt-3 flex gap-5">
              <Stat label="Duration" value={completedToday.durationMinutes ? `${completedToday.durationMinutes} min` : '—'} />
              <Stat label="Sets" value={String(summary.setCount)} />
              <Stat label="Volume" value={`${summary.volumeKg} kg`} />
            </div>
          )}
        </div>
      ) : activeSession ? (
        <div className="mt-2">
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{activeSession.planName}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Workout in progress</p>
          <button
            type="button"
            onClick={() => setActivePage('workout')}
            className="mt-3 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
          >
            Continue Workout
          </button>
        </div>
      ) : plan ? (
        <div className="mt-2">
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">{plan.name}</p>
          {plan.estimatedDurationMinutes && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">~{plan.estimatedDurationMinutes} min</p>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="mt-3 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white active:bg-neutral-800 dark:bg-white dark:text-neutral-900"
          >
            Start Workout
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-neutral-400">
            No workout scheduled for today. Start one from the Workout tab, or generate next week's plan.
          </p>
          <button
            type="button"
            onClick={() => setActivePage('workout')}
            className="mt-3 w-full rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
          >
            Go to Workout
          </button>
        </div>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase text-neutral-400">{label}</p>
      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{value}</p>
    </div>
  )
}
