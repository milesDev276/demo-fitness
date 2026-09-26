import type { WorkoutPlan } from '../../db/types'
import { useUiStore } from '../../store/useUiStore'
import { safely } from '../../utils/safely'
import { startSession } from './repository'

/** Starts a session from a plan and opens the workout screen. Shared by Today and the Calendar. */
export async function startAndOpenWorkout(plan: WorkoutPlan): Promise<boolean> {
  const started = await safely(() => startSession(plan), "We couldn't start this workout. Please try again.")
  if (started) useUiStore.getState().setActivePage('workout')
  return started
}
