import { useEffect } from 'react'
import { useToastStore } from '../store/useToastStore'

const AUTO_DISMISS_MS = 3500

export function Toast() {
  const message = useToastStore((s) => s.message)
  const clear = useToastStore((s) => s.clear)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(clear, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, clear])

  if (!message) return null

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md">
      <div className="rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg dark:bg-white dark:text-neutral-900">
        {message}
      </div>
    </div>
  )
}
