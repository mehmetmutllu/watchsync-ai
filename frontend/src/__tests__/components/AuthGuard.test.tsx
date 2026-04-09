import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AuthGuard from '@/components/auth/AuthGuard'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}))

// Mock the auth store
const mockAuthStore = {
  isAuthenticated: false,
  isLoading: true,
  hydrate: vi.fn(),
}

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isLoading = true
    mockAuthStore.isAuthenticated = false
  })

  it('shows loading spinner when isLoading is true', () => {
    mockAuthStore.isLoading = true

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockAuthStore.isLoading = false
    mockAuthStore.isAuthenticated = true

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    mockAuthStore.isLoading = false
    mockAuthStore.isAuthenticated = false

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })
  })

  it('calls hydrate on mount', () => {
    render(
      <AuthGuard>
        <div>Content</div>
      </AuthGuard>
    )

    expect(mockAuthStore.hydrate).toHaveBeenCalled()
  })
})
