import { useLiveQuery } from 'dexie-react-hooks'
import { todayLocalDate } from '../utils/date'
import { getTodayBodyLog } from '../features/body/repository'
import { getTodayNutritionLog } from '../features/nutrition/repository'
import { getTodayCheckIn } from '../features/recovery/repository'
import { getSessionsForDate } from '../features/workout/repository'

/** A lightweight "did I log today?" indicator — not gamification, just a nudge toward missing data. */
export function DailyChecklist() {
  const today = todayLocalDate()

  const sessions = useLiveQuery(() => getSessionsForDate(today), [today])
  const bodyLog = useLiveQuery(() => getTodayBodyLog(), [])
  const nutritionLog = useLiveQuery(() => getTodayNutritionLog(), [])
  const checkIn = useLiveQuery(() => getTodayCheckIn(), [])

  const items = [
    { label: 'Workout', done: sessions?.some((s) => s.status === 'completed') ?? false },
    { label: 'Weight', done: bodyLog?.weightKg !== undefined },
    { label: 'Nutrition', done: nutritionLog?.calories !== undefined || (nutritionLog?.meals?.length ?? 0) > 0 },
    {
      label: 'Recovery',
      done: checkIn?.sleepHours !== undefined || checkIn?.energy !== undefined || checkIn?.soreness !== undefined,
    },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({ label, done }) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            done
              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
              : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500'
          }`}
        >
          <span>{done ? '✓' : '○'}</span>
          {label}
        </span>
      ))}
    </div>
  )
}
