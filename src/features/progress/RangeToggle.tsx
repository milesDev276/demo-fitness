interface RangeOption {
  value: string
  label: string
}

interface RangeToggleProps {
  value: string
  options: RangeOption[]
  onChange: (value: string) => void
}

export function RangeToggle({ value, options, onChange }: RangeToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-900">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`min-h-9 rounded-md px-3 text-sm font-semibold transition-colors ${
            value === opt.value
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
