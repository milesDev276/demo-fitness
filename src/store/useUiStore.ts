import { create } from 'zustand'
import type { WorkoutPlan } from '../db/types'

/** 'workout' is a screen, not a tab: it's reached from Today or the Calendar and returns there. */
export type AppPage = 'today' | 'calendar' | 'workout' | 'progress' | 'me'

/** Which screen the Workout area is showing. Lives here so other pages can open one directly. */
export type WorkoutView =
  | { name: 'home' }
  | { name: 'create-plan' }
  | { name: 'edit-plan'; plan: WorkoutPlan }
  | { name: 'plan-week' }

interface UiState {
  activePage: AppPage
  workoutView: WorkoutView
  /** Where "Back" goes from the Workout area (whichever page opened it). */
  returnPage: AppPage
  setActivePage: (page: AppPage) => void
  setWorkoutView: (view: WorkoutView) => void
  /** Jump to a specific Workout screen from anywhere, remembering where we came from. */
  openWorkoutView: (view: WorkoutView) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  activePage: 'today',
  workoutView: { name: 'home' },
  returnPage: 'today',
  setActivePage: (page) => set({ activePage: page }),
  setWorkoutView: (view) => set({ workoutView: view }),
  openWorkoutView: (view) => {
    const from = get().activePage
    set({ activePage: 'workout', workoutView: view, returnPage: from === 'workout' ? get().returnPage : from })
  },
}))
