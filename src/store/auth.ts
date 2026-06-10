import { create } from 'zustand'
import type { AdminInfo } from '@/types/api'

interface AuthState {
  token: string | null
  admin: AdminInfo | null
  isAuthenticated: boolean
  setAuth: (token: string, admin: AdminInfo) => void
  logout: () => void
  hydrate: () => void
}

const STORAGE_KEY = 'auth-storage'
const EXPIRATION_TIME = 24 * 60 * 60 * 1000 // 1 день в мс

interface PersistedState {
  token: string
  admin: AdminInfo
  timestamp: number
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  admin: null,
  isAuthenticated: false,

  setAuth: (token, admin) => {
    const state: PersistedState = {
      token,
      admin,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    set({ token, admin, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, admin: null, isAuthenticated: false })
  },

  hydrate: () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const state = JSON.parse(stored) as PersistedState
      const isExpired = Date.now() - state.timestamp > EXPIRATION_TIME

      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY)
        set({ token: null, admin: null, isAuthenticated: false })
      } else {
        set({
          token: state.token,
          admin: state.admin,
          isAuthenticated: true,
        })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      set({ token: null, admin: null, isAuthenticated: false })
    }
  },
}))
