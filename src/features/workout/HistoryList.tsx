import { useLiveQuery } from 'dexie-react-hooks'
import { listHistory } from './repository'

interface HistoryListProps {
  onOpen: (sessionId: number) => void
  onClose: () => void
}

export function HistoryList({ onOpen, onClose }: HistoryListProps) {
  const sessions = useLiveQuery(() => listHistory(), [])

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onClose} className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          ← Back
        </button>
        <h1 className="text-base font-semibold text-neutral-900 dark:text-white">History</h1>
        <span className="w-10" />
      </div>

      <div className="mt-4 space-y-2">
        {sessions?.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onOpen(session.id!)}
            className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-3 text-left dark:border-neutral-800"
          >
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">{session.planName}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{session.date}</p>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {session.durationMinutes ? `${session.durationMinutes} min` : ''}
            </p>
          </button>
        ))}
        {sessions && sessions.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-400">No completed workouts yet.</p>
        )}
      </div>
    </div>
  )
}
