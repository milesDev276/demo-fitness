const pad = (n: number) => String(n).padStart(2, '0')

export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayLocalDate(): string {
  return toLocalDateString(new Date())
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return toLocalDateString(date)
}

export function startOfMonthLocal(dateStr: string): string {
  const date = parseLocalDate(dateStr)
  return toLocalDateString(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function formatShortDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatCompactDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
