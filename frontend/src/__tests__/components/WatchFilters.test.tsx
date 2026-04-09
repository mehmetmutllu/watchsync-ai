import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the inventory store
const mockSetFilters = vi.fn()
vi.mock('@/stores/inventoryStore', () => ({
  useInventoryStore: () => ({
    filters: {},
    setFilters: mockSetFilters,
  }),
}))

import WatchFilters from '@/components/inventory/WatchFilters'

describe('WatchFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input and status select', () => {
    render(<WatchFilters />)
    expect(
      screen.getByPlaceholderText('Marka, model veya referans no ara...')
    ).toBeInTheDocument()
    expect(screen.getByText('Tüm Durumlar')).toBeInTheDocument()
  })

  it('calls setFilters on Enter key in search', async () => {
    const user = userEvent.setup()
    render(<WatchFilters />)

    const input = screen.getByPlaceholderText('Marka, model veya referans no ara...')
    await user.type(input, 'Rolex{Enter}')

    expect(mockSetFilters).toHaveBeenCalledWith({ search: 'Rolex' })
  })

  it('calls setFilters on status change', async () => {
    const user = userEvent.setup()
    render(<WatchFilters />)

    const select = screen.getByDisplayValue('Tüm Durumlar')
    await user.selectOptions(select, 'active')

    expect(mockSetFilters).toHaveBeenCalledWith({ status: 'active' })
  })

  it('toggles advanced filters panel', async () => {
    const user = userEvent.setup()
    render(<WatchFilters />)

    expect(screen.queryByPlaceholderText('Min fiyat')).not.toBeInTheDocument()

    await user.click(screen.getByText('Filtreler'))

    expect(screen.getByPlaceholderText('Min fiyat')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Max fiyat')).toBeInTheDocument()
  })

  it('does not show clear button when no filters active', () => {
    render(<WatchFilters />)
    expect(screen.queryByText('Temizle')).not.toBeInTheDocument()
  })
})
