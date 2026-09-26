import { useState, type ReactNode } from 'react'

interface InfoTipProps {
  /** What the tip explains, used for the button's accessible name. */
  term: string
  children: ReactNode
}

/** A small "?" that reveals a one-line plain-language explanation on demand. */
export function InfoTip({ term, children }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`What is ${term}?`}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 align-middle text-xs font-semibold normal-case text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      >
        ?
      </button>
      {open && (
        <span role="note" className="mt-1 block text-xs font-normal normal-case tracking-normal text-neutral-600 dark:text-neutral-300">
          {children}
        </span>
      )}
    </>
  )
}
