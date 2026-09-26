import { useLiveQuery } from 'dexie-react-hooks'
import { todayLocalDate } from '../utils/date'
import { getTodayBodyLog } from '../features/body/repository'
import { getTodayNutritionLog } from '../features/nutrition/repository'
import { getTodayCheckIn } from '../features/recovery/repository'
import { getSessionsForDate } from '../features/workout/repository'

/** A lightweight "did I log today?" indicator — not gamification, just a nudge toward missing data. Tap a missing item to jump to it. */
export function DailyChecklist() {
  const today = todayLocalDate()

  const sessions = useLiveQuery(() => getSessionsForDate(today), [today])
  const bodyLog = useLiveQuery(() => getTodayBodyLog(), [])
  const nutritionLog = useLiveQuery(() => getTodayNutritionLog(), [])
  const checkIn = useLiveQuery(() => getTodayCheckIn(), [])

  const items = [
    { label: 'Workout', target: null, done: sessions?.some((s) => s.status === 'completed') ?? false },
    { label: 'Recovery', target: 'log-recovery', done: checkIn?.sleepHours !== undefined || checkIn?.energy !== undefined || checkIn?.soreness !== undefined },
    { label: 'Nutrition', target: 'log-nutrition', done: nutritionLog?.calories !== undefined || (nutritionLog?.meals?.length ?? 0) > 0 },
    { label: 'Weight', target: 'log-body', done: bodyLog?.weightKg !== undefined },
  ]

  function jumpTo(target: string | null) {
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="grid grid-cols-4 gap-2" role="list" aria-label="Today's checklist">
      {items.map(({ label, target, done }) => (
        <button
          key={label}
          type="button"
          role="listitem"
          onClick={() => jumpTo(target)}
          aria-label={`${label}: ${done ? 'done' : 'not done yet'}`}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium ${
            done
              ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400'
          }`}
        >
          <span aria-hidden="true">{done ? '✓' : '○'}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
