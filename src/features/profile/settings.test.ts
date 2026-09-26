import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/dbTestUtils'
import { db } from '../../db/db'
import { buildWeeklyPlanPreview } from '../adaptive/planner/repository'
import { getProfile, updateProfile } from './repository'

beforeEach(resetDb)

describe('settings persistence', () => {
  it('starts from the owner baseline', async () => {
    const profile = await getProfile()
    expect(profile).toMatchObject({ trainingDaysPerWeek: 4, goalMuscularEmphasis: 0.5, goalAthleticEmphasis: 0.5 })
  })

  it('saves training days, duration, goal balance and equipment', async () => {
    await updateProfile({
      availableDays: [1, 3, 5],
      sessionDurationMinutes: 45,
      goalMuscularEmphasis: 0.7,
      goalAthleticEmphasis: 0.3,
      equipment: ['home'],
    })
    expect(await getProfile()).toMatchObject({
      availableDays: [1, 3, 5],
      sessionDurationMinutes: 45,
      goalMuscularEmphasis: 0.7,
      goalAthleticEmphasis: 0.3,
      equipment: ['home'],
    })
    expect(await db.userProfile.count()).toBe(1)
  })

  it('saves nutrition targets exactly as entered and never changes them on its own', async () => {
    await updateProfile({ calorieTarget: 2400, proteinTarget: 150 })
    await updateProfile({ carbTarget: 250 }) // unrelated update
    expect(await getProfile()).toMatchObject({ calorieTarget: 2400, proteinTarget: 150, carbTarget: 250 })

    await updateProfile({ carbTarget: undefined })
    expect((await getProfile()).carbTarget).toBeUndefined()
  })
})

describe('settings drive the weekly planner', () => {
  it('plans as many sessions as the configured days/sessions allow', async () => {
    await updateProfile({ availableDays: [1, 2, 4, 6], trainingDaysPerWeek: 4 })
    const four = await buildWeeklyPlanPreview()

    await updateProfile({ availableDays: [1, 4], trainingDaysPerWeek: 2 })
    const two = await buildWeeklyPlanPreview()

    expect(two.days.length).toBeLessThan(four.days.length)
    expect(two.availableDayCount).toBe(2)
    expect(two.days.every((d) => [1, 4].includes(d.dayOfWeek))).toBe(true)
  })

  it('only uses exercises that fit the chosen equipment', async () => {
    await updateProfile({ equipment: ['bodyweight'] })
    const plan = await buildWeeklyPlanPreview()
    const exercises = await db.exercises.toArray()
    const byId = new Map(exercises.map((e) => [e.id!, e]))

    const used = plan.days.flatMap((d) => d.exercises.map((e) => byId.get(e.exerciseId)!))
    expect(used.length).toBeGreaterThan(0)
    expect(used.every((e) => ['bodyweight', 'none'].includes(e.equipment))).toBe(true)
  })

  it('shorter sessions produce shorter estimated workouts', async () => {
    await updateProfile({ sessionDurationMinutes: 90 })
    const long = await buildWeeklyPlanPreview()
    await updateProfile({ sessionDurationMinutes: 40 })
    const short = await buildWeeklyPlanPreview()

    const total = (p: typeof long) => p.days.reduce((sum, d) => sum + d.estimatedDurationMinutes, 0)
    expect(total(short)).toBeLessThan(total(long))
  })

  it('goal balance changes whether athletic work is included', async () => {
    await updateProfile({ goalMuscularEmphasis: 1, goalAthleticEmphasis: 0 })
    const muscular = await buildWeeklyPlanPreview()
    await updateProfile({ goalMuscularEmphasis: 0.2, goalAthleticEmphasis: 0.8 })
    const athletic = await buildWeeklyPlanPreview()

    const athleticDays = (p: typeof muscular) => p.days.filter((d) => d.athleticLabel !== null).length
    expect(athleticDays(athletic)).toBeGreaterThan(athleticDays(muscular))
  })
})
