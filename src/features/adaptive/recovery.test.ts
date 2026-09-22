import { describe, expect, it } from 'vitest'
import { classifyRecovery } from './recovery'

describe('classifyRecovery', () => {
  it('returns unknown when no recovery data exists', () => {
    expect(classifyRecovery(null)).toBe('unknown')
    expect(classifyRecovery({})).toBe('unknown')
  })

  it('classifies good recovery', () => {
    expect(classifyRecovery({ sleepHours: 8, energy: 8, soreness: 2 })).toBe('good')
  })

  it('classifies moderate recovery', () => {
    expect(classifyRecovery({ sleepHours: 6, energy: 5, soreness: 5 })).toBe('moderate')
  })

  it('classifies poor recovery', () => {
    expect(classifyRecovery({ sleepHours: 5, energy: 3, soreness: 8 })).toBe('poor')
  })

  it('does not let a single bad signal dominate', () => {
    expect(classifyRecovery({ sleepHours: 5 })).toBe('moderate')
  })
})
