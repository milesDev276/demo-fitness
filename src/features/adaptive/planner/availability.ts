/**
 * Picks `targetCount` items out of `orderedItems` (already in chronological/meaningful order),
 * spread as evenly as possible. If there are fewer items than the target, all of them are used
 * (doc #13 — never invent extra days). Deterministic: no randomness.
 */
export function selectSpacedItems<T>(orderedItems: T[], targetCount: number): T[] {
  const items = Array.from(new Set(orderedItems))
  if (targetCount <= 0 || items.length === 0) return []
  if (items.length <= targetCount) return items

  const picked: T[] = []
  for (let i = 0; i < targetCount; i++) {
    const index = Math.min(items.length - 1, Math.floor(((i + 0.5) * items.length) / targetCount))
    picked.push(items[index])
  }
  return picked
}

/** Mon=0 .. Sun=6 ordering, used to sort weekday numbers (which are Date#getDay()'s 0=Sun..6=Sat) chronologically within a Monday-started week. */
export function mondayFirstIndex(weekday: number): number {
  return weekday === 0 ? 6 : weekday - 1
}
