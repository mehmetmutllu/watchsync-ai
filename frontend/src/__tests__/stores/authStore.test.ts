import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { act } from '@testing-library/react'

// Mock the api module
vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import api from '@/lib/api'

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Reset store state
    act(() => {
      useAuthStore.setState({
        user: null,
        token: null,
        isLoading: true,
        isAuthenticated: false,
      })
    })
  })

  it('hydrate sets isLoading false when no token', () => {
    act(() => {
      useAuthStore.getState().hydrate()
    })

    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.isAuthenticated).toBe(false)
  })

  it('hydrate sets authenticated when token exists', () => {
    localStorage.setItem('auth_token', 'test-token')

    vi.mocked(api.get).mockResolvedValue({
      data: {
        user: { id: 1, name: 'Test', email: 'test@test.com' },
      },
    })

    act(() => {
      useAuthStore.getState().hydrate()
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('test-token')
  })

  it('login stores token and user', async () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@test.com' }

    vi.mocked(api.post).mockResolvedValue({
      data: { user: mockUser, token: 'new-token', message: 'OK' },
    })

    await act(async () => {
      await useAuthStore.getState().login('test@test.com', 'password')
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('new-token')
    expect(state.user).toEqual(mockUser)
    expect(localStorage.getItem('auth_token')).toBe('new-token')
  })

  it('logout clears store and localStorage', async () => {
    // Pre-set an authenticated state
    localStorage.setItem('auth_token', 'test-token')
    act(() => {
      useAuthStore.setState({
        user: { id: 1 } as any,
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
      })
    })

    vi.mocked(api.post).mockResolvedValue({ data: {} })

    await act(async () => {
      await useAuthStore.getState().logout()
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('fetchUser sets user on success', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' }

    vi.mocked(api.get).mockResolvedValue({
      data: { user: mockUser },
    })

    await act(async () => {
      await useAuthStore.getState().fetchUser()
    })

    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('fetchUser clears state on error', async () => {
    localStorage.setItem('auth_token', 'expired-token')

    vi.mocked(api.get).mockRejectedValue(new Error('Unauthorized'))

    await act(async () => {
      await useAuthStore.getState().fetchUser()
    })

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth_token')).toBeNull()
  })
})
