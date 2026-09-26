import { useLiveQuery } from 'dexie-react-hooks'
import { formatShortDate, todayLocalDate } from '../../utils/date'
import { useUiStore } from '../../store/useUiStore'
import { ResetWorkoutMenu } from './ResetWorkoutMenu'
import { startAndOpenWorkout } from './startWorkout'
import {
  getActiveSession,
  getNextWorkout,
  getSessionSummary,
  getSessionsForDate,
  type ScheduledPlan,
} from './repository'

const PRIMARY_ON_DARK = 'w-full rounded-xl bg-white py-3.5 text-base font-semibold text-neutral-900 active:bg-neutral-200'

export function TodayWorkoutCard() {
  const today = todayLocalDate()
  const setActivePage = useUiStore((s) => s.setActivePage)
  const openWorkoutView = useUiStore((s) => s.openWorkoutView)

  // `null` means "checked, nothing there"; `undefined` means "still loading" — so we never flash the empty state.
  const activeSession = useLiveQuery(async () => (await getActiveSession()) ?? null, [])
  const todaySessions = useLiveQuery(() => getSessionsForDate(today), [today])
  const next = useLiveQuery(async () => (await getNextWorkout(today)) ?? null, [today])

  const completedToday = todaySessions?.find((s) => s.status === 'completed')
  const summary = useLiveQuery(
    () => (completedToday ? getSessionSummary(completedToday.id!) : Promise.resolve(null)),
    [completedToday?.id],
  )

  function handleStart(scheduled: ScheduledPlan) {
    return startAndOpenWorkout(scheduled.plan)
  }

  if (activeSession === undefined || todaySessions === undefined || next === undefined) {
    return <section aria-busy="true" className="h-36 rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
  }

  if (activeSession) {
    return (
      <HeroCard label="In progress" title={activeSession.planName} detail="Pick up where you left off.">
        <button type="button" onClick={() => setActivePage('workout')} className={PRIMARY_ON_DARK}>
          Continue Workout
        </button>
      </HeroCard>
    )
  }

  if (completedToday) {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">✓ Workout completed</p>
            <p className="mt-0.5 text-xl font-semibold text-neutral-900 dark:text-white">{completedToday.planName}</p>
          </div>
          <div className="-mr-2 -mt-2">
            <ResetWorkoutMenu sessionId={completedToday.id!} />
          </div>
        </div>
        {summary && (
          <div className="mt-3 flex gap-6">
            <Stat label="Duration" value={completedToday.durationMinutes ? `${completedToday.durationMinutes} min` : '—'} />
            <Stat label="Sets" value={String(summary.setCount)} />
            <Stat label="Volume" value={`${summary.volumeKg} kg`} />
          </div>
        )}
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">Next: log how you feel and what you ate below.</p>
        {next && (
          <p className="mt-1 text-sm text-neutral-500">
            Up next: {next.plan.name} · {formatShortDate(next.plan.scheduledDate!)}
          </p>
        )}
      </section>
    )
  }

  if (next) {
    const { plan, status } = next
    const label =
      status === 'today' ? 'Today' : status === 'missed' ? `Missed · ${formatShortDate(plan.scheduledDate!)}` : `Next · ${formatShortDate(plan.scheduledDate!)}`
    const details = [
      `${plan.exercises.length} exercises`,
      plan.estimatedDurationMinutes ? `~${plan.estimatedDurationMinutes} min` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    return (
      <HeroCard label={label} title={plan.name} detail={details}>
        <button type="button" onClick={() => handleStart(next)} className={PRIMARY_ON_DARK}>
          {status === 'upcoming' ? 'Start Early' : 'Start Workout'}
        </button>
        <button
          type="button"
          onClick={() => openWorkoutView({ name: 'home' })}
          className="mt-1 w-full py-2.5 text-sm font-medium text-neutral-300"
        >
          Choose a different workout
        </button>
      </HeroCard>
    )
  }

  return (
    <HeroCard label="Today" title="No workout planned" detail="Let FitFlow plan your training days, or start one of your own.">
      <button type="button" onClick={() => openWorkoutView({ name: 'plan-week' })} className={PRIMARY_ON_DARK}>
        Plan My Week
      </button>
      <button
        type="button"
        onClick={() => openWorkoutView({ name: 'home' })}
        className="mt-1 w-full py-2.5 text-sm font-medium text-neutral-300"
      >
        Choose a workout
      </button>
    </HeroCard>
  )
}

function HeroCard({ label, title, detail, children }: { label: string; title: string; detail?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-neutral-900 p-5 text-white dark:bg-neutral-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-300">{label}</p>
      <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      {detail && <p className="mt-0.5 text-sm text-neutral-300">{detail}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-neutral-500">{label}</p>
      <p className="text-base font-semibold text-neutral-900 dark:text-white">{value}</p>
    </div>
  )
}
