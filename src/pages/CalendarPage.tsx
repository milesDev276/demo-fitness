import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DayDetail } from '../features/calendar/DayDetail'
import { markersFor, monthWeeks, summarizeMonth, type DayMarker } from '../features/calendar/calendar'
import { getCalendarMonth, hasCompletedWorkouts } from '../features/calendar/repository'
import { useUiStore } from '../store/useUiStore'
import { formatShortDate, todayLocalDate } from '../utils/date'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MARKER_LABEL: Record<DayMarker, string> = { completed: 'completed', planned: 'planned', missed: 'missed' }

/** Training calendar: see → understand → navigate. Derived entirely from existing workout history and plans. */
export function CalendarPage() {
  const today = todayLocalDate()
  const [thisYear, thisMonth] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1]

  const [view, setView] = useState({ year: thisYear, month: thisMonth })
  const [selected, setSelected] = useState(today)
  const setActivePage = useUiStore((s) => s.setActivePage)
  const openWorkoutView = useUiStore((s) => s.openWorkoutView)

  const days = useLiveQuery(() => getCalendarMonth(view.year, view.month, today), [view.year, view.month, today])
  const anyHistory = useLiveQuery(() => hasCompletedWorkouts(), [])

  const weeks = monthWeeks(view.year, view.month)
  const summary = days ? summarizeMonth(days) : null
  const isCurrentMonth = view.year === thisYear && view.month === thisMonth
  const monthTitle = new Date(view.year, view.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function goToMonth(offset: number) {
    const next = new Date(view.year, view.month + offset, 1)
    const target = { year: next.getFullYear(), month: next.getMonth() }
    setView(target)
    // Keep the detail panel inside the month being looked at.
    const inTarget = target.year === thisYear && target.month === thisMonth
    setSelected(inTarget ? today : `${target.year}-${String(target.month + 1).padStart(2, '0')}-01`)
  }

  function goToToday() {
    setView({ year: thisYear, month: thisMonth })
    setSelected(today)
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Calendar</h1>
        <button
          type="button"
          onClick={() => openWorkoutView({ name: 'plan-week' })}
          className="min-h-10 px-2 text-sm font-medium text-blue-700 dark:text-blue-400"
        >
          Plan week
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
          className="h-11 w-11 rounded-full text-xl text-neutral-700 active:bg-neutral-100 dark:text-neutral-300 dark:active:bg-neutral-800"
        >
          ‹
        </button>
        <div className="text-center">
          <p aria-live="polite" className="text-lg font-semibold text-neutral-900 dark:text-white">
            {monthTitle}
          </p>
          {summary && (summary.completed > 0 || summary.plannedAhead > 0) && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {summary.completed} completed{summary.plannedAhead > 0 ? ` · ${summary.plannedAhead} planned ahead` : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className="h-11 w-11 rounded-full text-xl text-neutral-700 active:bg-neutral-100 dark:text-neutral-300 dark:active:bg-neutral-800"
        >
          ›
        </button>
      </div>

      {!isCurrentMonth && (
        <div className="text-center">
          <button type="button" onClick={goToToday} className="min-h-10 px-3 text-sm font-medium text-blue-700 dark:text-blue-400">
            Back to today
          </button>
        </div>
      )}

      <div role="grid" aria-label={monthTitle} className="mt-2">
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <div key={d} role="columnheader" className="py-1 text-center text-xs font-medium text-neutral-500">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, i) => (
          <div key={i} role="row" className="grid grid-cols-7">
            {week.map((date, j) => {
              if (!date) return <div key={j} role="gridcell" />
              const markers = markersFor(days?.get(date))
              const isToday = date === today
              const isSelected = date === selected
              const label = `${formatShortDate(date)}${isToday ? ', today' : ''}${markers.length ? ': ' + markers.map((m) => MARKER_LABEL[m]).join(', ') : ''}`
              return (
                <div key={j} role="gridcell" className="p-0.5">
                  <button
                    type="button"
                    onClick={() => setSelected(date)}
                    aria-label={label}
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    className={`flex h-14 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 ${
                      isSelected ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday
                          ? 'bg-neutral-900 font-bold text-white dark:bg-white dark:text-neutral-900'
                          : 'font-medium text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {Number(date.slice(8))}
                    </span>
                    <span className="flex h-2 items-center gap-1" aria-hidden="true">
                      {markers.map((m) => (
                        <Marker key={m} kind={m} />
                      ))}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <p className="mt-2 flex flex-wrap justify-center gap-x-4 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5"><Marker kind="completed" /> Completed</span>
        <span className="inline-flex items-center gap-1.5"><Marker kind="planned" /> Planned</span>
        <span className="inline-flex items-center gap-1.5"><Marker kind="missed" /> Missed</span>
      </p>

      {anyHistory === false && days && days.size === 0 && (
        <div className="mt-4 rounded-xl bg-neutral-100 p-4 text-center dark:bg-neutral-900">
          <p className="font-semibold text-neutral-900 dark:text-white">No workouts yet.</p>
          <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">Your completed workouts will appear here.</p>
          <button
            type="button"
            onClick={() => setActivePage('today')}
            className="mt-3 min-h-11 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            Go to Today’s Workout
          </button>
        </div>
      )}

      <DayDetail date={selected} day={days?.get(selected)} />

      <button
        type="button"
        onClick={() => openWorkoutView({ name: 'home' })}
        className="mt-6 min-h-11 w-full rounded-xl border border-neutral-300 text-sm font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
      >
        My workouts
      </button>
    </div>
  )
}

/** One dot per state, told apart by shape as well as colour: filled = done, ring = planned, small dash = missed. */
function Marker({ kind }: { kind: DayMarker }) {
  if (kind === 'completed') return <span className="h-2 w-2 rounded-full bg-green-600" />
  if (kind === 'planned') return <span className="h-2 w-2 rounded-full border-2 border-neutral-700 dark:border-neutral-300" />
  return <span className="h-0.5 w-2 rounded-full bg-amber-600" />
}
