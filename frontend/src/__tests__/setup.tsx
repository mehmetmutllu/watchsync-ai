import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import trMessages from '../../messages/tr.json'

// Mock next-intl: resolve useTranslations against the real Turkish messages so
// component tests get actual strings without wrapping each render in a provider.
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>()
  return {
    ...actual,
    useTranslations: ((namespace?: string) =>
      actual.createTranslator({
        locale: 'tr',
        messages: trMessages as never,
        namespace: namespace as never,
      })) as typeof actual.useTranslations,
    useLocale: () => 'tr',
    // Bileşenler tarih/para biçimlendirmesi için useFormatter() kullanıyor;
    // testlerde de gerçek Intl davranışını verelim.
    useFormatter: (() =>
      actual.createFormatter({ locale: 'tr' })) as typeof actual.useFormatter,
  }
})

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
    ;(Component as unknown as { displayName: string }).displayName = 'DynamicComponent'
    return Component
  },
}))
