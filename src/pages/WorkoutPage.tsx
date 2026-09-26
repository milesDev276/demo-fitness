import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getActiveSession, getSession } from '../features/workout/repository'
import { ActiveSession } from '../features/workout/ActiveSession'
import { PlanList } from '../features/workout/PlanList'
import { PlanEditor } from '../features/workout/PlanEditor'
import { WeeklyPlanScreen } from '../features/adaptive/planner'
import { useUiStore } from '../store/useUiStore'

export function WorkoutPage() {
  const view = useUiStore((s) => s.workoutView)
  const setView = useUiStore((s) => s.setWorkoutView)
  const setActivePage = useUiStore((s) => s.setActivePage)
  const returnPage = useUiStore((s) => s.returnPage)
  const home = () => setView({ name: 'home' })

  const activeSession = useLiveQuery(() => getActiveSession(), [])

  // Keep viewing the session by a fixed id (not "is it still in_progress") so completing it
  // doesn't yank the screen away before ActiveSession can show its completion summary. Setting
  // state during render (not in an effect) is the react.dev-recommended way to adjust state in
  // response to a prop/query change — it re-renders before paint instead of after (doc #29).
  const [viewingSessionId, setViewingSessionId] = useState<number | null>(null)
  // Ids of sessions that were deleted (reset). Session ids are never reused, so a deleted id can be
  // ignored safely even while the live query still reports it as active for a moment.
  const [goneId, setGoneId] = useState<number | null>(null)

  const viewingSession = useLiveQuery(
    async () => (viewingSessionId !== null ? ((await getSession(viewingSessionId)) ?? null) : undefined),
    [viewingSessionId],
  )
  // The session we were showing was deleted (reset from Today or the Calendar): forget it, so the next
  // workout that starts is picked up below instead of leaving a stale, empty screen.
  if (viewingSessionId !== null && viewingSession === null) {
    setGoneId(viewingSessionId)
    setViewingSessionId(null)
  }
  if (activeSession && viewingSessionId === null && activeSession.id !== goneId) {
    setViewingSessionId(activeSession.id!)
  }

  if (viewingSessionId !== null && viewingSession) {
    return (
      <ActiveSession
        session={viewingSession}
        onEnded={() => {
          setViewingSessionId(null)
          home()
          // After a workout the next step is logging recovery/nutrition, which lives on Today.
          setActivePage('today')
        }}
      />
    )
  }

  if (view.name === 'create-plan') {
    return <PlanEditor plan={null} onDone={home} />
  }

  if (view.name === 'edit-plan') {
    return <PlanEditor plan={view.plan} onDone={home} />
  }

  if (view.name === 'plan-week') {
    return (
      <WeeklyPlanScreen
        // Cancel / Done go back to wherever the planner was opened from (Calendar, Today or the chooser).
        onDone={() => {
          home()
          setActivePage(returnPage)
        }}
        onOpenToday={() => {
          home()
          setActivePage('today')
        }}
      />
    )
  }

  return (
    <PlanList
      onSessionStarted={(sessionId) => setViewingSessionId(sessionId)}
      onCreatePlan={() => setView({ name: 'create-plan' })}
      onEditPlan={(plan) => setView({ name: 'edit-plan', plan })}
      onBack={() => setActivePage(returnPage)}
      onPlanWeek={() => setView({ name: 'plan-week' })}
    />
  )
}
