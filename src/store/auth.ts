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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  admin: null,
  isAuthenticated: false,

  setAuth: (token, admin) => {
    localStorage.setItem('token', token)
    localStorage.setItem('admin', JSON.stringify(admin))
    set({ token, admin, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    set({ token: null, admin: null, isAuthenticated: false })
  },

  hydrate: () => {
    const token = localStorage.getItem('token')
    const adminStr = localStorage.getItem('admin')
    if (token && adminStr) {
      try {
        const admin = JSON.parse(adminStr) as AdminInfo
        set({ token, admin, isAuthenticated: true })
      } catch {
        set({ token: null, admin: null, isAuthenticated: false })
      }
    }
  },
}))
