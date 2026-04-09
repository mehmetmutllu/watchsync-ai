import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from '@/components/inventory/EmptyState'

describe('EmptyState', () => {
  it('renders empty state message', () => {
    render(<EmptyState onAddClick={vi.fn()} />)

    expect(screen.getByText('Henüz saat eklenmemiş')).toBeInTheDocument()
    expect(
      screen.getByText(/Envanterinize saat ekleyerek başlayın/)
    ).toBeInTheDocument()
  })

  it('renders add button', () => {
    render(<EmptyState onAddClick={vi.fn()} />)

    expect(screen.getByText('İlk Saatinizi Ekleyin')).toBeInTheDocument()
  })

  it('calls onAddClick when button is clicked', async () => {
    const user = userEvent.setup()
    const onAddClick = vi.fn()

    render(<EmptyState onAddClick={onAddClick} />)

    await user.click(screen.getByText('İlk Saatinizi Ekleyin'))
    expect(onAddClick).toHaveBeenCalledOnce()
  })
})
