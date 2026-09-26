import { useEffect } from 'react'
import { Navigation } from './components/Navigation'
import { Toast } from './components/Toast'
import { CalendarPage } from './pages/CalendarPage'
import { MePage } from './pages/MePage'
import { ProgressPage } from './pages/ProgressPage'
import { TodayPage } from './pages/TodayPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { useUiStore } from './store/useUiStore'

function App() {
  const activePage = useUiStore((state) => state.activePage)

  // Every tab opens at the top rather than wherever the previous tab was scrolled.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activePage])

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 dark:bg-neutral-950">
      <div className="mx-auto max-w-md border-neutral-200 sm:border-x dark:border-neutral-800">
        {activePage === 'today' && <TodayPage />}
        {/* Stays mounted (just hidden) so a half-finished set, open exercise, unsaved workout or rest
            timer survive a quick trip to another tab mid-workout. */}
        <div hidden={activePage !== 'workout'}>
          <WorkoutPage />
        </div>
        {activePage === 'calendar' && <CalendarPage />}
        {activePage === 'progress' && <ProgressPage />}
        {activePage === 'me' && <MePage />}
      </div>
      <Toast />
      <Navigation />
    </div>
  )
}

export default App
