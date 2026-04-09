import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SyncStatusBadges from '@/components/inventory/SyncStatusBadges'

// Mock lucide icons
vi.mock('lucide-react', () => ({
  CheckCircle: (props: any) => <svg data-testid="check-icon" {...props} />,
  Clock: (props: any) => <svg data-testid="clock-icon" {...props} />,
  XCircle: (props: any) => <svg data-testid="x-icon" {...props} />,
}))

describe('SyncStatusBadges', () => {
  it('renders dash when no syncStatuses', () => {
    render(<SyncStatusBadges />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders dash when no connected platforms', () => {
    render(
      <SyncStatusBadges
        syncStatuses={[
          { platform_id: 1, platform_name: 'eBay', connected: false, sync_status: 'never' },
        ]}
      />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders badges for connected platforms', () => {
    render(
      <SyncStatusBadges
        syncStatuses={[
          { platform_id: 1, platform_name: 'eBay', connected: true, sync_status: 'success' },
          { platform_id: 2, platform_name: 'Chrono24', connected: true, sync_status: 'pending' },
        ]}
      />
    )
    expect(screen.getAllByText('eBay').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Chrono24').length).toBeGreaterThanOrEqual(1)
  })

  it('does not render disconnected platforms', () => {
    render(
      <SyncStatusBadges
        syncStatuses={[
          { platform_id: 1, platform_name: 'eBay', connected: true, sync_status: 'success' },
          { platform_id: 2, platform_name: 'Shopify', connected: false, sync_status: 'never' },
        ]}
      />
    )
    expect(screen.getAllByText('eBay').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Shopify')).not.toBeInTheDocument()
  })
})
