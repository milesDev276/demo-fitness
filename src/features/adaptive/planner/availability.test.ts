import { describe, expect, it } from 'vitest'
import { selectSpacedItems } from './availability'

describe('selectSpacedItems', () => {
  it('returns everything when there are fewer items than the target', () => {
    expect(selectSpacedItems(['Mon', 'Wed', 'Sat'], 4)).toEqual(['Mon', 'Wed', 'Sat'])
  })

  it('returns everything when items exactly match the target', () => {
    expect(selectSpacedItems(['Mon', 'Tue', 'Thu', 'Sat'], 4)).toEqual(['Mon', 'Tue', 'Thu', 'Sat'])
  })

  it('picks exactly the target count, never more, when there are extra items', () => {
    const picked = selectSpacedItems(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], 4)
    expect(picked).toHaveLength(4)
    for (const day of picked) {
      expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).toContain(day)
    }
  })

  it('preserves original relative order', () => {
    const picked = selectSpacedItems([0, 1, 2, 3, 4, 5, 6], 3)
    const indices = picked.map((v) => [0, 1, 2, 3, 4, 5, 6].indexOf(v))
    expect(indices).toEqual([...indices].sort((a, b) => a - b))
  })

  it('returns an empty list when the target is zero', () => {
    expect(selectSpacedItems(['Mon', 'Tue'], 0)).toEqual([])
  })
})
