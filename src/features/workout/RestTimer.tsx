import { useEffect, useRef, useState } from 'react'

interface RestTimerProps {
  seconds: number
  onDone: () => void
}

function playBeep() {
  try {
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return
    const ctx = new AudioContextCtor()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.4)
  } catch {
    // Best-effort only — silence is an acceptable fallback.
  }
}

function notifyRestDone() {
  playBeep()
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification('Rest complete', { body: 'Time for your next set.' })
    } catch {
      // Notifications aren't guaranteed to be supported everywhere — ignore failures.
    }
  }
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function RestTimer({ seconds, onDone }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const [paused, setPaused] = useState(false)
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (paused) return
    if (remaining <= 0) {
      if (!notifiedRef.current) {
        notifiedRef.current = true
        notifyRestDone()
      }
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, paused])

  const isDone = remaining <= 0

  return (
    <div role="timer" aria-live="off" className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        {isDone ? 'Rest complete' : 'Rest'}
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">{formatTime(Math.max(0, remaining))}</p>

      <div className="mt-2 flex justify-center gap-2">
        {!isDone && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        )}
        {!isDone && (
          <button
            type="button"
            onClick={() => setRemaining((r) => r + 30)}
            className="rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            +30s
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900"
        >
          {isDone ? 'Dismiss' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
