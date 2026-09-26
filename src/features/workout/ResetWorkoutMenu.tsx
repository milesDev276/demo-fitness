import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToastStore } from '../../store/useToastStore'
import { safely } from '../../utils/safely'
import { resetWorkout } from './repository'

interface ResetWorkoutMenuProps {
  sessionId: number
  /** Called after a successful reset, e.g. to leave a screen that showed the deleted session. */
  onReset?: () => void
}

/**
 * A quiet "⋯" menu holding "Reset today's workout". Reset is never one tap: it opens a menu, then a
 * confirmation. It undoes this one workout (sets + session) and nothing else.
 */
export function ResetWorkoutMenu({ sessionId, onReset }: ResetWorkoutMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    const ok = await safely(
      () => resetWorkout(sessionId),
      "Couldn't reset the workout. Your existing data has not been changed.",
    )
    setBusy(false)
    setConfirming(false)
    setMenuOpen(false)
    if (ok) {
      useToastStore.getState().show('Workout reset. You can start it again.')
      onReset?.()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="More workout actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="h-11 w-11 rounded-full text-xl leading-none text-neutral-600 active:bg-neutral-200/60 dark:text-neutral-400 dark:active:bg-neutral-800"
      >
        ⋯
      </button>

      {menuOpen && (
        <>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 cursor-default" />
          <div role="menu" className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirming(true)}
              className="min-h-11 w-full rounded-lg px-3 text-left text-sm font-medium text-red-700 active:bg-red-50 dark:text-red-400 dark:active:bg-red-950/40"
            >
              Reset today’s workout
            </button>
          </div>
        </>
      )}

      {confirming && (
        <ConfirmDialog
          title="Reset today’s workout?"
          message="This will remove the workout progress for today and return the workout to its initial state. Your other workouts and your body, nutrition and recovery logs are not affected."
          confirmLabel="Reset Workout"
          busy={busy}
          onCancel={() => {
            setConfirming(false)
            setMenuOpen(false)
          }}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
