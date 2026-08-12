import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  // Her URL dil önekiyle gelir (/tr/..., /de/..., /en/..., /ar/...) —
  // SEO ve paylaşılan linklerin dili korumasi için.
  localePrefix: 'always',
  // Kullanıcının seçimi 1 yıl hatırlanır; seçim yaptıysa otomatik tespit
  // bir daha araya girmez.
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
  // Ülke tespiti middleware'de yapılıp Accept-Language'a yansıtılır;
  // next-intl bu bilgiyi kullanarak yönlendirir.
  localeDetection: true,
  // <link rel="alternate" hreflang="..."> etiketleri otomatik eklensin.
  alternateLinks: true,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
