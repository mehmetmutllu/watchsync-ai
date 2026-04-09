import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { usePlatformStore } from '@/stores/platformStore'

vi.mock('@/lib/platforms-api', () => ({
  platformsApi: {
    list: vi.fn(),
    updateCredentials: vi.fn(),
    disconnect: vi.fn(),
  },
}))

import { platformsApi } from '@/lib/platforms-api'

describe('platformStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      usePlatformStore.setState({
        platforms: [],
        isLoading: false,
        error: null,
      })
    })
  })

  it('fetchPlatforms loads platforms', async () => {
    const mockPlatforms = [
      { id: 1, name: 'eBay', status: 'connected' },
      { id: 2, name: 'Chrono24', status: 'disconnected' },
    ]
    vi.mocked(platformsApi.list).mockResolvedValue(mockPlatforms as any)

    await act(async () => {
      await usePlatformStore.getState().fetchPlatforms()
    })

    const state = usePlatformStore.getState()
    expect(state.platforms).toHaveLength(2)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('fetchPlatforms sets error on failure', async () => {
    vi.mocked(platformsApi.list).mockRejectedValue(new Error('Timeout'))

    await act(async () => {
      await usePlatformStore.getState().fetchPlatforms()
    })

    expect(usePlatformStore.getState().error).toBe('Timeout')
    expect(usePlatformStore.getState().isLoading).toBe(false)
  })

  it('updateCredentials refreshes platforms', async () => {
    const refreshed = [{ id: 1, name: 'eBay', status: 'connected' }]
    vi.mocked(platformsApi.updateCredentials).mockResolvedValue(undefined as any)
    vi.mocked(platformsApi.list).mockResolvedValue(refreshed as any)

    await act(async () => {
      await usePlatformStore.getState().updateCredentials(1, {
        api_key: 'key',
        api_secret: 'secret',
      } as any)
    })

    expect(platformsApi.updateCredentials).toHaveBeenCalledWith(1, {
      api_key: 'key',
      api_secret: 'secret',
    })
    expect(platformsApi.list).toHaveBeenCalled()
  })

  it('updateCredentials sets error and rethrows on failure', async () => {
    vi.mocked(platformsApi.updateCredentials).mockRejectedValue(new Error('Invalid key'))

    await act(async () => {
      try {
        await usePlatformStore.getState().updateCredentials(1, {} as any)
      } catch {
        // expected
      }
    })

    expect(usePlatformStore.getState().error).toBe('Invalid key')
  })

  it('disconnectPlatform optimistically updates status', async () => {
    act(() => {
      usePlatformStore.setState({
        platforms: [
          { id: 1, name: 'eBay', status: 'connected' },
          { id: 2, name: 'Chrono24', status: 'connected' },
        ] as any,
      })
    })

    vi.mocked(platformsApi.disconnect).mockResolvedValue(undefined as any)

    await act(async () => {
      await usePlatformStore.getState().disconnectPlatform(1)
    })

    const platforms = usePlatformStore.getState().platforms
    expect(platforms[0].status).toBe('disconnected')
    expect(platforms[1].status).toBe('connected')
  })

  it('disconnectPlatform sets error on failure', async () => {
    act(() => {
      usePlatformStore.setState({
        platforms: [{ id: 1, name: 'eBay', status: 'connected' }] as any,
      })
    })

    vi.mocked(platformsApi.disconnect).mockRejectedValue(new Error('Cannot disconnect'))

    await act(async () => {
      try {
        await usePlatformStore.getState().disconnectPlatform(1)
      } catch {
        // expected
      }
    })

    expect(usePlatformStore.getState().error).toBe('Cannot disconnect')
  })

  it('clearError resets error', () => {
    act(() => {
      usePlatformStore.setState({ error: 'Some error' })
    })

    act(() => {
      usePlatformStore.getState().clearError()
    })

    expect(usePlatformStore.getState().error).toBeNull()
  })
})
