import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useNotificationStore } from '@/stores/notificationStore'

vi.mock('@/lib/platforms-api', () => ({
  platformsApi: {
    getNotifications: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
  },
}))

import { platformsApi } from '@/lib/platforms-api'

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    act(() => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        isDrawerOpen: false,
      })
    })
  })

  it('fetchNotifications loads notifications', async () => {
    const mockData = {
      notifications: [
        { id: 1, message: 'Test', read: false },
        { id: 2, message: 'Test 2', read: true },
      ],
      unread_count: 1,
    }
    vi.mocked(platformsApi.getNotifications).mockResolvedValue(mockData as any)

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications()
    })

    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(2)
    expect(state.unreadCount).toBe(1)
    expect(state.isLoading).toBe(false)
  })

  it('fetchNotifications handles error silently', async () => {
    vi.mocked(platformsApi.getNotifications).mockRejectedValue(new Error('fail'))

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications()
    })

    expect(useNotificationStore.getState().isLoading).toBe(false)
  })

  it('markAllRead updates all notifications', async () => {
    act(() => {
      useNotificationStore.setState({
        notifications: [
          { id: 1, message: 'A', read: false },
          { id: 2, message: 'B', read: false },
        ] as any,
        unreadCount: 2,
      })
    })

    vi.mocked(platformsApi.markAllNotificationsRead).mockResolvedValue(undefined as any)

    await act(async () => {
      await useNotificationStore.getState().markAllRead()
    })

    const state = useNotificationStore.getState()
    expect(state.notifications.every((n) => n.read)).toBe(true)
    expect(state.unreadCount).toBe(0)
  })

  it('markRead updates single notification', async () => {
    act(() => {
      useNotificationStore.setState({
        notifications: [
          { id: 1, message: 'A', read: false },
          { id: 2, message: 'B', read: false },
        ] as any,
        unreadCount: 2,
      })
    })

    vi.mocked(platformsApi.markNotificationRead).mockResolvedValue(undefined as any)

    await act(async () => {
      await useNotificationStore.getState().markRead(1)
    })

    const state = useNotificationStore.getState()
    expect(state.notifications[0].read).toBe(true)
    expect(state.notifications[1].read).toBe(false)
    expect(state.unreadCount).toBe(1)
  })

  it('markRead does not go below 0', async () => {
    act(() => {
      useNotificationStore.setState({
        notifications: [{ id: 1, message: 'A', read: false }] as any,
        unreadCount: 0,
      })
    })

    vi.mocked(platformsApi.markNotificationRead).mockResolvedValue(undefined as any)

    await act(async () => {
      await useNotificationStore.getState().markRead(1)
    })

    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })

  it('toggleDrawer opens and fetches notifications', async () => {
    vi.mocked(platformsApi.getNotifications).mockResolvedValue({
      notifications: [],
      unread_count: 0,
    } as any)

    act(() => {
      useNotificationStore.getState().toggleDrawer()
    })

    expect(useNotificationStore.getState().isDrawerOpen).toBe(true)
    expect(platformsApi.getNotifications).toHaveBeenCalled()
  })

  it('toggleDrawer closes without fetching', () => {
    act(() => {
      useNotificationStore.setState({ isDrawerOpen: true })
    })

    act(() => {
      useNotificationStore.getState().toggleDrawer()
    })

    expect(useNotificationStore.getState().isDrawerOpen).toBe(false)
    expect(platformsApi.getNotifications).not.toHaveBeenCalled()
  })

  it('closeDrawer sets isDrawerOpen false', () => {
    act(() => {
      useNotificationStore.setState({ isDrawerOpen: true })
    })

    act(() => {
      useNotificationStore.getState().closeDrawer()
    })

    expect(useNotificationStore.getState().isDrawerOpen).toBe(false)
  })
})
