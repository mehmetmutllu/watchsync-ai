import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useInventoryStore } from '@/stores/inventoryStore'

vi.mock('@/lib/watches-api', () => ({
  watchesApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

import { watchesApi } from '@/lib/watches-api'

const INITIAL_STATE = {
  watches: [],
  pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
  filters: {},
  isLoading: false,
  error: null,
  selectedWatch: null,
  isDetailLoading: false,
}

describe('inventoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useInventoryStore.setState(INITIAL_STATE)
    })
  })

  it('fetchWatches sets watches and pagination', async () => {
    const mockResponse = {
      data: [{ id: 1, brand: 'Rolex', model: 'Submariner' }],
      current_page: 1,
      last_page: 3,
      per_page: 15,
      total: 42,
    }
    vi.mocked(watchesApi.list).mockResolvedValue(mockResponse)

    await act(async () => {
      await useInventoryStore.getState().fetchWatches()
    })

    const state = useInventoryStore.getState()
    expect(state.watches).toEqual(mockResponse.data)
    expect(state.pagination.total).toBe(42)
    expect(state.isLoading).toBe(false)
  })

  it('fetchWatches sets error on failure', async () => {
    vi.mocked(watchesApi.list).mockRejectedValue(new Error('Network error'))

    await act(async () => {
      await useInventoryStore.getState().fetchWatches()
    })

    const state = useInventoryStore.getState()
    expect(state.error).toBe('Network error')
    expect(state.isLoading).toBe(false)
  })

  it('setFilters resets page to 1 and fetches', async () => {
    vi.mocked(watchesApi.list).mockResolvedValue({
      data: [],
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    })

    await act(async () => {
      useInventoryStore.getState().setFilters({ status: 'active' as any })
    })

    expect(watchesApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active', page: 1 })
    )
  })

  it('fetchWatch sets selectedWatch', async () => {
    const mockWatch = { id: 5, brand: 'Omega', model: 'Speedmaster' } as any
    vi.mocked(watchesApi.get).mockResolvedValue(mockWatch)

    let result: any
    await act(async () => {
      result = await useInventoryStore.getState().fetchWatch(5)
    })

    expect(result).toEqual(mockWatch)
    expect(useInventoryStore.getState().selectedWatch).toEqual(mockWatch)
    expect(useInventoryStore.getState().isDetailLoading).toBe(false)
  })

  it('createWatch triggers fetchWatches', async () => {
    const mockWatch = { id: 10, brand: 'IWC' } as any
    vi.mocked(watchesApi.create).mockResolvedValue(mockWatch)
    vi.mocked(watchesApi.list).mockResolvedValue({
      data: [mockWatch],
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 1,
    })

    await act(async () => {
      await useInventoryStore.getState().createWatch({ brand: 'IWC' } as any)
    })

    expect(watchesApi.create).toHaveBeenCalled()
    expect(watchesApi.list).toHaveBeenCalled()
  })

  it('updateWatch optimistically updates list', async () => {
    act(() => {
      useInventoryStore.setState({
        watches: [{ id: 1, brand: 'Rolex', model: 'Sub' } as any],
      })
    })

    const updated = { id: 1, brand: 'Rolex', model: 'Submariner Date' } as any
    vi.mocked(watchesApi.update).mockResolvedValue(updated)

    await act(async () => {
      await useInventoryStore.getState().updateWatch(1, { model: 'Submariner Date' } as any)
    })

    const watch = useInventoryStore.getState().watches.find((w) => w.id === 1)
    expect(watch?.model).toBe('Submariner Date')
  })

  it('deleteWatch optimistically removes from list', async () => {
    act(() => {
      useInventoryStore.setState({
        watches: [
          { id: 1, brand: 'Rolex' } as any,
          { id: 2, brand: 'Omega' } as any,
        ],
        pagination: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
      })
    })

    vi.mocked(watchesApi.delete).mockResolvedValue(undefined as any)

    await act(async () => {
      await useInventoryStore.getState().deleteWatch(1)
    })

    const state = useInventoryStore.getState()
    expect(state.watches).toHaveLength(1)
    expect(state.watches[0].id).toBe(2)
    expect(state.pagination.total).toBe(1)
  })

  it('deleteWatch rolls back on error', async () => {
    act(() => {
      useInventoryStore.setState({
        watches: [{ id: 1, brand: 'Rolex' } as any],
        pagination: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
      })
    })

    vi.mocked(watchesApi.delete).mockRejectedValue(new Error('Server error'))
    vi.mocked(watchesApi.list).mockResolvedValue({
      data: [{ id: 1, brand: 'Rolex' }],
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 1,
    } as any)

    await act(async () => {
      try {
        await useInventoryStore.getState().deleteWatch(1)
      } catch {
        // expected
      }
    })

    expect(watchesApi.list).toHaveBeenCalled()
    expect(useInventoryStore.getState().error).toBe('Server error')
  })

  it('updateWatchStatus optimistically updates watch', async () => {
    act(() => {
      useInventoryStore.setState({
        watches: [{ id: 1, brand: 'Rolex', status: 'draft' } as any],
      })
    })

    vi.mocked(watchesApi.updateStatus).mockResolvedValue({
      id: 1,
      brand: 'Rolex',
      status: 'active',
    } as any)

    await act(async () => {
      await useInventoryStore.getState().updateWatchStatus(1, 'active' as any)
    })

    const watch = useInventoryStore.getState().watches.find((w) => w.id === 1)
    expect(watch?.status).toBe('active')
  })

  it('clearError resets error to null', () => {
    act(() => {
      useInventoryStore.setState({ error: 'Some error' })
    })

    act(() => {
      useInventoryStore.getState().clearError()
    })

    expect(useInventoryStore.getState().error).toBeNull()
  })
})
