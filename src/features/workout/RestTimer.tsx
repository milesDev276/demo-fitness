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
  try {
    navigator.vibrate?.(200)
  } catch {
    // Vibration isn't available everywhere.
  }
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

const BUTTON = 'min-h-9 rounded-lg px-3 text-sm font-semibold'

/**
 * A slim bar pinned to the top of the workout screens. Time is derived from an end timestamp, not from
 * counting ticks, so it stays correct after the phone sleeps or the tab is throttled.
 */
export function RestTimer({ seconds, onDone }: RestTimerProps) {
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000)
  const [now, setNow] = useState(() => Date.now())
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null)
  const notifiedRef = useRef(false)

  const paused = pausedRemaining !== null
  const remaining = paused ? pausedRemaining : Math.max(0, Math.ceil((endAt - now) / 1000))
  const isDone = remaining <= 0

  useEffect(() => {
    if (paused || isDone) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [paused, isDone])

  useEffect(() => {
    if (isDone && !notifiedRef.current) {
      notifiedRef.current = true
      notifyRestDone()
    }
  }, [isDone])

  function togglePause() {
    if (paused) {
      setEndAt(Date.now() + pausedRemaining * 1000)
      setNow(Date.now())
      setPausedRemaining(null)
    } else {
      setPausedRemaining(remaining)
    }
  }

  function addThirty() {
    if (paused) setPausedRemaining(pausedRemaining + 30)
    else {
      // Re-arm the "done" notification if time is added after it fired.
      notifiedRef.current = false
      setEndAt(Math.max(endAt, Date.now()) + 30_000)
      setNow(Date.now())
    }
  }

  return (
    <div
      role="timer"
      aria-label={isDone ? 'Rest complete' : `Rest, ${formatTime(remaining)} remaining`}
      className={`sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-2 text-white ${
        isDone ? 'bg-green-700' : 'bg-neutral-900 dark:bg-neutral-800'
      }`}
    >
      <div className="leading-tight">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-300">{isDone ? 'Rest over' : paused ? 'Rest paused' : 'Rest'}</p>
        <p className="text-2xl font-bold tabular-nums">{isDone ? 'Go!' : formatTime(remaining)}</p>
      </div>

      <div className="flex gap-2">
        {!isDone && (
          <button type="button" onClick={togglePause} className={`${BUTTON} bg-white/15`}>
            {paused ? 'Resume' : 'Pause'}
          </button>
        )}
        <button type="button" onClick={addThirty} className={`${BUTTON} bg-white/15`}>
          +30s
        </button>
        <button type="button" onClick={onDone} className={`${BUTTON} bg-white text-neutral-900`}>
          {isDone ? 'Dismiss' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
