import { useLiveQuery } from 'dexie-react-hooks'
import { getActiveSession } from '../features/workout/repository'
import type { AppPage } from '../store/useUiStore'
import { useUiStore } from '../store/useUiStore'

const NAV_ITEMS: { page: AppPage; label: string }[] = [
  { page: 'today', label: 'Today' },
  { page: 'calendar', label: 'Calendar' },
  { page: 'progress', label: 'Progress' },
  { page: 'me', label: 'Me' },
]

export function Navigation() {
  const activePage = useUiStore((state) => state.activePage)
  const setActivePage = useUiStore((state) => state.setActivePage)
  const activeSession = useLiveQuery(async () => (await getActiveSession()) ?? null, [])

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 h-14 border-t border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <ul className="mx-auto flex h-full max-w-md">
        {NAV_ITEMS.map(({ page, label }) => {
          // The workout screen belongs to Today (that's where "Start" lives), so Today stays lit during a workout.
          const isActive = page === activePage || (page === 'today' && activePage === 'workout')
          const inProgress = page === 'today' && !!activeSession
          return (
            <li key={page} className="flex-1">
              <button
                type="button"
                onClick={() => setActivePage(page)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex h-full w-full items-center justify-center gap-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {isActive && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-neutral-900 dark:bg-white" />}
                {label}
                {inProgress && (
                  <span role="img" aria-label="workout in progress" className="h-2 w-2 rounded-full bg-green-500" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
