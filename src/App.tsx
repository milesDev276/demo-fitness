import { Navigation } from './components/Navigation'
import { MePage } from './pages/MePage'
import { ProgressPage } from './pages/ProgressPage'
import { TodayPage } from './pages/TodayPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { useUiStore } from './store/useUiStore'

function App() {
  const activePage = useUiStore((state) => state.activePage)

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 dark:bg-neutral-950">
      {activePage === 'today' && <TodayPage />}
      {activePage === 'workout' && <WorkoutPage />}
      {activePage === 'progress' && <ProgressPage />}
      {activePage === 'me' && <MePage />}
      <Navigation />
    </div>
  )
}

export default App
