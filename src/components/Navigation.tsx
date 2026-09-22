import type { AppPage } from '../store/useUiStore'
import { useUiStore } from '../store/useUiStore'

const NAV_ITEMS: { page: AppPage; label: string }[] = [
  { page: 'today', label: 'Today' },
  { page: 'workout', label: 'Workout' },
  { page: 'progress', label: 'Progress' },
  { page: 'me', label: 'Me' },
]

export function Navigation() {
  const activePage = useUiStore((state) => state.activePage)
  const setActivePage = useUiStore((state) => state.setActivePage)

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ page, label }) => {
          const isActive = page === activePage
          return (
            <li key={page} className="flex-1">
              <button
                type="button"
                onClick={() => setActivePage(page)}
                className={`w-full py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
