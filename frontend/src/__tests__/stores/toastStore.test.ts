import { describe, it, expect, beforeEach } from 'vitest'
import { useToastStore, toast } from '@/stores/toastStore'
import { act } from '@testing-library/react'

describe('toastStore', () => {
  beforeEach(() => {
    act(() => {
      useToastStore.getState().clearToasts()
    })
  })

  it('adds a toast', () => {
    act(() => {
      useToastStore.getState().addToast({
        type: 'success',
        title: 'Test Toast',
        message: 'Test message',
      })
    })

    const state = useToastStore.getState()
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0].title).toBe('Test Toast')
    expect(state.toasts[0].type).toBe('success')
  })

  it('removes a toast', () => {
    act(() => {
      useToastStore.getState().addToast({
        type: 'info',
        title: 'To Remove',
        duration: 0, // no auto-remove
      })
    })

    const toastId = useToastStore.getState().toasts[0].id

    act(() => {
      useToastStore.getState().removeToast(toastId)
    })

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('limits to 5 toasts', () => {
    act(() => {
      for (let i = 0; i < 7; i++) {
        useToastStore.getState().addToast({
          type: 'info',
          title: `Toast ${i}`,
          duration: 0,
        })
      }
    })

    expect(useToastStore.getState().toasts.length).toBeLessThanOrEqual(5)
  })

  it('clears all toasts', () => {
    act(() => {
      useToastStore.getState().addToast({ type: 'success', title: 'A', duration: 0 })
      useToastStore.getState().addToast({ type: 'error', title: 'B', duration: 0 })
    })

    act(() => {
      useToastStore.getState().clearToasts()
    })

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('toast helpers work correctly', () => {
    act(() => {
      toast.success('Success!', 'All good')
    })

    const state = useToastStore.getState()
    expect(state.toasts[0].type).toBe('success')
    expect(state.toasts[0].title).toBe('Success!')
    expect(state.toasts[0].message).toBe('All good')
  })

  it('error toast has longer duration', () => {
    act(() => {
      toast.error('Error!', 'Something bad')
    })

    const state = useToastStore.getState()
    expect(state.toasts[0].type).toBe('error')
    expect(state.toasts[0].duration).toBe(8000)
  })
})
