import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { act } from '@testing-library/react'

// Mock the api module
vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
  getCsrfCookie: vi.fn().mockResolvedValue(undefined),
}))

import api from '@/lib/api'

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset store state
    act(() => {
      useAuthStore.setState({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      })
    })
  })

  it('hydrate calls fetchUser to check cookie session', () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Unauthorized'))

    act(() => {
      useAuthStore.getState().hydrate()
    })

    // fetchUser should be called — cookies are sent automatically
    expect(api.get).toHaveBeenCalledWith('/auth/me')
  })

  it('hydrate sets authenticated when session exists', async () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@test.com' }

    vi.mocked(api.get).mockResolvedValue({
      data: { user: mockUser },
    })

    await act(async () => {
      useAuthStore.getState().hydrate()
      // Wait for async fetchUser
      await new Promise((r) => setTimeout(r, 10))
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
  })

  it('login sets user (cookie-based)', async () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@test.com' }

    vi.mocked(api.post).mockResolvedValue({
      data: { user: mockUser, message: 'OK' },
    })

    await act(async () => {
      await useAuthStore.getState().login('test@test.com', 'password')
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(mockUser)
  })

  it('logout clears store', async () => {
    // Pre-set an authenticated state
    act(() => {
      useAuthStore.setState({
        user: { id: 1 } as any,
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
    vi.mocked(api.get).mockRejectedValue(new Error('Unauthorized'))

    await act(async () => {
      await useAuthStore.getState().fetchUser()
    })

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
