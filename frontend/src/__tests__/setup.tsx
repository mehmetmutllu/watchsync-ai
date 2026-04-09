import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { fill, priority, ...rest } = props as { fill?: boolean; priority?: boolean; [key: string]: unknown }
    return <img {...rest} />
  },
}))

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    const Component = vi.fn(() => null)
    Component.displayName = 'DynamicComponent'
    return Component
  },
}))
