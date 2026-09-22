import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { WorkoutPlan } from '../db/types'
import { getActiveSession } from '../features/workout/repository'
import { ActiveSession } from '../features/workout/ActiveSession'
import { PlanList } from '../features/workout/PlanList'
import { PlanEditor } from '../features/workout/PlanEditor'
import { HistoryList } from '../features/workout/HistoryList'
import { HistoryDetail } from '../features/workout/HistoryDetail'

type View =
  | { name: 'home' }
  | { name: 'create-plan' }
  | { name: 'edit-plan'; plan: WorkoutPlan }
  | { name: 'history' }
  | { name: 'history-detail'; sessionId: number }

export function WorkoutPage() {
  const [view, setView] = useState<View>({ name: 'home' })
  const activeSession = useLiveQuery(() => getActiveSession(), [])

  if (activeSession) {
    return <ActiveSession session={activeSession} onEnded={() => setView({ name: 'home' })} />
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

  return (
    <PlanList
      onSessionStarted={() => setView({ name: 'home' })}
      onCreatePlan={() => setView({ name: 'create-plan' })}
      onEditPlan={(plan) => setView({ name: 'edit-plan', plan })}
      onOpenHistory={() => setView({ name: 'history' })}
    />
  )
}
