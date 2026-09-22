import { create } from 'zustand'

export type AppPage = 'today' | 'workout' | 'progress' | 'me'

interface UiState {
  activePage: AppPage
  setActivePage: (page: AppPage) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePage: 'today',
  setActivePage: (page) => set({ activePage: page }),
}))
