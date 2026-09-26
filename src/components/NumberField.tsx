import { useState } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onCommit: (value: number) => void
}

/** Lets the user clear and retype freely; the clamped value is only saved on blur. */
export function NumberField({ label, value, min, max, step, onCommit }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)

  function commit() {
    if (draft === null) return
    const parsed = Number(draft)
    setDraft(null)
    if (draft.trim() === '' || Number.isNaN(parsed)) return
    const clamped = Math.min(max, Math.max(min, parsed))
    if (clamped !== value) onCommit(clamped)
  }

  return (
    <label className="block">
      <span className="text-[11px] uppercase text-neutral-400">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
      />
    </label>
  )
}
