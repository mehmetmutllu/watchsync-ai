import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { defaultLocale, getBcp47, isLocale, localeMeta } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    // Tarih/saat ve sayı biçimleri de dile göre değişsin.
    timeZone: 'Europe/Istanbul',
    now: new Date(),
    formats: {
      dateTime: {
        short: { day: 'numeric', month: 'short', year: 'numeric' },
        long: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
      },
      number: {
        currency: {
          style: 'currency',
          currency: isLocale(locale) ? localeMeta[locale].currency : 'EUR',
          maximumFractionDigits: 0,
        },
      },
    },
    // Eksik bir anahtar üretimde sayfayı çökertmesin; geliştirmede konsola düşsün.
    onError(error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[i18n]', error.message);
    },
    getMessageFallback({ key, namespace }) {
      const path = [namespace, key].filter(Boolean).join('.');
      return process.env.NODE_ENV === 'production' ? key.split('.').pop() ?? key : `⟪${path}⟫`;
    },
  };
});

export { defaultLocale, getBcp47 };
