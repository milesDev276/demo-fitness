import { useEffect, useId } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** A destructive-action confirmation. Cancel is the focused, default choice; Escape and tapping outside cancel. */
export function ConfirmDialog({ title, message, confirmLabel, busy, onCancel, onConfirm }: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900"
      >
        <h2 id={titleId} className="text-lg font-semibold text-neutral-900 dark:text-white">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          {message}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={busy}
            className="min-h-12 flex-1 rounded-xl border border-neutral-300 text-base font-semibold text-neutral-800 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-12 flex-1 rounded-xl bg-red-600 text-base font-semibold text-white active:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Resetting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
