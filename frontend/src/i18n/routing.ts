import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'tr', 'de'],
  defaultLocale: 'de'
});

export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);
