import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TableSkeleton from '@/components/inventory/TableSkeleton'

describe('TableSkeleton', () => {
  it('renders a table element', () => {
    render(<TableSkeleton />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
  })

  it('renders 8 skeleton rows', () => {
    const { container } = render(<TableSkeleton />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(8)
  })
})
