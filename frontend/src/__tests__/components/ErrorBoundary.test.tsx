import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Suppress error boundary console.error in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Child content</div>
}

import { afterAll } from 'vitest'

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders fallback UI on error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Bir şeyler yanlış gitti')).toBeInTheDocument()
    expect(screen.getByText('Tekrar Dene')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('recovers when retry button is clicked', async () => {
    const user = userEvent.setup()

    // We need a component that can toggle throwing
    let shouldThrow = true
    function ToggleThrow() {
      if (shouldThrow) throw new Error('Test error')
      return <div>Recovered</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ToggleThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('Bir şeyler yanlış gitti')).toBeInTheDocument()

    // After clicking retry, the error state resets
    shouldThrow = false
    await user.click(screen.getByText('Tekrar Dene'))

    // ErrorBoundary resets state and re-renders children
    rerender(
      <ErrorBoundary>
        <ToggleThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })
})
