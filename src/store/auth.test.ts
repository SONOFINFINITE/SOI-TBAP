import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.admin).toBeNull()
  })

  it('setAuth stores token and admin', () => {
    useAuthStore.getState().setAuth('jwt-token', { id: 1, username: 'admin' })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('jwt-token')
    expect(state.admin).toEqual({ id: 1, username: 'admin' })
    expect(localStorage.getItem('token')).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem('admin')!)).toEqual({ id: 1, username: 'admin' })
  })

  it('logout clears everything', () => {
    useAuthStore.getState().setAuth('jwt-token', { id: 1, username: 'admin' })
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.admin).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('admin')).toBeNull()
  })

  it('hydrate restores from localStorage', () => {
    localStorage.setItem('token', 'saved-token')
    localStorage.setItem('admin', JSON.stringify({ id: 2, username: 'user2' }))

    useAuthStore.getState().hydrate()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('saved-token')
    expect(state.admin).toEqual({ id: 2, username: 'user2' })
  })

  it('hydrate handles corrupted localStorage', () => {
    localStorage.setItem('token', 'saved-token')
    localStorage.setItem('admin', '{invalid json}')

    useAuthStore.getState().hydrate()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
  })

  it('hydrate does nothing with empty localStorage', () => {
    useAuthStore.getState().hydrate()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
  })
})
