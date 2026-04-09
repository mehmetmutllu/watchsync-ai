import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/inventory/StatusBadge'
import userEvent from '@testing-library/user-event'
import type { WatchStatus } from '@/types'

describe('StatusBadge', () => {
  it('renders correct label for each status', () => {
    const statuses: { status: WatchStatus; label: string }[] = [
      { status: 'draft', label: 'Taslak' },
      { status: 'active', label: 'Aktif' },
      { status: 'reserved', label: 'Rezerve' },
      { status: 'sold', label: 'Satıldı' },
      { status: 'maintenance', label: 'Bakımda' },
    ]

    for (const { status, label } of statuses) {
      const { unmount } = render(<StatusBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('does not show dropdown when no transitions allowed', () => {
    render(<StatusBadge status="sold" />)
    const button = screen.getByText('Satıldı')
    expect(button.closest('button')).toHaveClass('cursor-default')
  })

  it('shows dropdown on click when transitions available', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()

    render(
      <StatusBadge
        status="active"
        onStatusChange={onStatusChange}
        allowedTransitions={['reserved', 'sold']}
      />
    )

    await user.click(screen.getByText('Aktif'))

    expect(screen.getByText('Rezerve')).toBeInTheDocument()
    expect(screen.getByText('Satıldı')).toBeInTheDocument()
  })

  it('calls onStatusChange when transition is selected', async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()

    render(
      <StatusBadge
        status="active"
        onStatusChange={onStatusChange}
        allowedTransitions={['reserved']}
      />
    )

    await user.click(screen.getByText('Aktif'))
    await user.click(screen.getByText('Rezerve'))

    expect(onStatusChange).toHaveBeenCalledWith('reserved')
  })
})
