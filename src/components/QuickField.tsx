import { useEffect, useRef, useState } from 'react'

interface QuickFieldProps {
  label: string
  /** Current saved value, or undefined when nothing is logged yet. */
  value: number | undefined
  placeholder?: string
  step?: string
  inputMode?: 'decimal' | 'numeric'
  /** Small text after the label, e.g. "/ 2400". */
  hint?: string
  /** Resolves true when the value was stored (see utils/safely). */
  onSave: (value: number | undefined) => Promise<boolean>
}

const SAVED_FLASH_MS = 1600

/**
 * A number input that makes saving obvious: a Save button appears as soon as the value differs from
 * what's stored, Enter and leaving the field also save, and "Saved" confirms it. Nothing is lost if the
 * keypad has no Enter key.
 */
export function QuickField({ label, value, placeholder = '—', step, inputMode = 'decimal', hint, onSave }: QuickFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), SAVED_FLASH_MS)
    return () => clearTimeout(timer)
  }, [saved])

  const storedText = value !== undefined ? String(value) : ''
  const text = draft ?? storedText
  const dirty = draft !== null && draft !== storedText

  async function commit() {
    if (savingRef.current) return // Save tap + the blur it causes must not save twice
    if (!dirty) {
      setDraft(null)
      return
    }
    const parsed = text.trim() === '' ? undefined : Number(text)
    if (parsed !== undefined && Number.isNaN(parsed)) return
    savingRef.current = true
    try {
      if (await onSave(parsed)) {
        setDraft(null)
        setSaved(true)
      }
    } finally {
      savingRef.current = false
    }
  }

  return (
    <label className="block">
      <span className="text-xs uppercase text-neutral-500">
        {label}
        {hint && <span className="normal-case"> {hint}</span>}
      </span>
      <span className="relative mt-1 block">
        <input
          ref={inputRef}
          type="number"
          inputMode={inputMode}
          step={step}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit()
              inputRef.current?.blur()
            }
          }}
          className="w-full rounded-lg border border-neutral-200 py-2 pl-3 pr-16 text-lg font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
        />
        {dirty ? (
          <button
            type="button"
            // Keep focus in the field so the click isn't swallowed by the blur that would save first.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              commit()
              inputRef.current?.blur() // closes the keyboard; the blur-save is skipped while this save is running
            }}
            className="absolute inset-y-1.5 right-1.5 rounded-md bg-neutral-900 px-2.5 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            Save
          </button>
        ) : (
          saved && (
            <span role="status" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-green-600">
              ✓ Saved
            </span>
          )
        )}
      </span>
    </label>
  )
}
