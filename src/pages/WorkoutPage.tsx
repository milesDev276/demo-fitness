import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { WorkoutPlan } from '../db/types'
import { getActiveSession, getSession } from '../features/workout/repository'
import { ActiveSession } from '../features/workout/ActiveSession'
import { PlanList } from '../features/workout/PlanList'
import { PlanEditor } from '../features/workout/PlanEditor'
import { HistoryList } from '../features/workout/HistoryList'
import { HistoryDetail } from '../features/workout/HistoryDetail'
import { WeeklyPlanScreen } from '../features/adaptive/planner'

type View =
  | { name: 'home' }
  | { name: 'create-plan' }
  | { name: 'edit-plan'; plan: WorkoutPlan }
  | { name: 'history' }
  | { name: 'history-detail'; sessionId: number }
  | { name: 'plan-week' }

export function WorkoutPage() {
  const [view, setView] = useState<View>({ name: 'home' })
  const activeSession = useLiveQuery(() => getActiveSession(), [])

  // Keep viewing the session by a fixed id (not "is it still in_progress") so completing it
  // doesn't yank the screen away before ActiveSession can show its completion summary. Setting
  // state during render (not in an effect) is the react.dev-recommended way to adjust state in
  // response to a prop/query change — it re-renders before paint instead of after (doc #29).
  const [viewingSessionId, setViewingSessionId] = useState<number | null>(null)
  if (activeSession && viewingSessionId === null) {
    setViewingSessionId(activeSession.id!)
  }

  const viewingSession = useLiveQuery(
    () => (viewingSessionId !== null ? getSession(viewingSessionId) : undefined),
    [viewingSessionId],
  )

  if (viewingSessionId !== null && viewingSession) {
    return (
      <ActiveSession
        session={viewingSession}
        onEnded={() => {
          setViewingSessionId(null)
          setView({ name: 'home' })
        }}
      />
    )
  }

  if (view.name === 'create-plan') {
    return <PlanEditor plan={null} onDone={() => setView({ name: 'home' })} />
  }

  if (view.name === 'edit-plan') {
    return <PlanEditor plan={view.plan} onDone={() => setView({ name: 'home' })} />
  }

  if (view.name === 'history') {
    return (
      <HistoryList
        onOpen={(sessionId) => setView({ name: 'history-detail', sessionId })}
        onClose={() => setView({ name: 'home' })}
      />
    )
  }

  if (view.name === 'history-detail') {
    return <HistoryDetail sessionId={view.sessionId} onClose={() => setView({ name: 'history' })} />
  }

  if (view.name === 'plan-week') {
    return <WeeklyPlanScreen onDone={() => setView({ name: 'home' })} />
  }

  return (
    <PlanList
      onSessionStarted={(sessionId) => setViewingSessionId(sessionId)}
      onCreatePlan={() => setView({ name: 'create-plan' })}
      onEditPlan={(plan) => setView({ name: 'edit-plan', plan })}
      onOpenHistory={() => setView({ name: 'history' })}
      onPlanWeek={() => setView({ name: 'plan-week' })}
    />
  )
}
