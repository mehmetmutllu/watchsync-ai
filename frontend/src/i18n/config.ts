/**
 * Tek kaynak: desteklenen diller, yön (LTR/RTL), ülke → dil eşlemesi.
 * Yeni bir dil eklemek için burayı ve messages/<locale>.json dosyasını güncellemek yeterlidir.
 */

export const locales = ['tr', 'de', 'en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export type LocaleMeta = {
  code: Locale;
  /** Dilin kendi dilindeki adı — dil seçicide bu gösterilir */
  nativeName: string;
  /** Kısa etiket (mobil / dar alan) */
  short: string;
  /** Bayrak emojisi */
  flag: string;
  dir: 'ltr' | 'rtl';
  /** Intl API'leri (tarih, para, sayı) için tam BCP-47 etiketi */
  bcp47: string;
  /** Para birimi biçimlendirmesi için varsayılan */
  currency: string;
};

export const localeMeta: Record<Locale, LocaleMeta> = {
  tr: { code: 'tr', nativeName: 'Türkçe', short: 'TR', flag: '🇹🇷', dir: 'ltr', bcp47: 'tr-TR', currency: 'TRY' },
  de: { code: 'de', nativeName: 'Deutsch', short: 'DE', flag: '🇩🇪', dir: 'ltr', bcp47: 'de-DE', currency: 'EUR' },
  en: { code: 'en', nativeName: 'English', short: 'EN', flag: '🇬🇧', dir: 'ltr', bcp47: 'en-GB', currency: 'EUR' },
  ar: { code: 'ar', nativeName: 'العربية', short: 'AR', flag: '🇸🇦', dir: 'rtl', bcp47: 'ar-SA', currency: 'AED' },
};

export const localeList: LocaleMeta[] = locales.map((l) => localeMeta[l]);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return isLocale(locale) ? localeMeta[locale].dir : 'ltr';
}

export function getBcp47(locale: string): string {
  return isLocale(locale) ? localeMeta[locale].bcp47 : localeMeta[defaultLocale].bcp47;
}

/* ------------------------------------------------------------------ */
/* Ülke (ISO 3166-1 alpha-2) → dil                                     */
/* ------------------------------------------------------------------ */

const TURKISH_COUNTRIES = ['TR'];

const GERMAN_COUNTRIES = ['DE', 'AT', 'CH', 'LI', 'LU'];

const ARABIC_COUNTRIES = [
  'SA', 'AE', 'EG', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ',
  'SY', 'YE', 'PS', 'LY', 'DZ', 'MA', 'TN', 'SD', 'MR', 'SO',
  'DJ', 'KM', 'TD', 'ER',
];

export const countryToLocale: Record<string, Locale> = Object.fromEntries([
  ...TURKISH_COUNTRIES.map((c) => [c, 'tr' as Locale]),
  ...GERMAN_COUNTRIES.map((c) => [c, 'de' as Locale]),
  ...ARABIC_COUNTRIES.map((c) => [c, 'ar' as Locale]),
]);

/** Ülke kodundan dil. Eşleşme yoksa `null` (çağıran taraf fallback uygular). */
export function localeFromCountry(country: string | null | undefined): Locale | null {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  if (code.length !== 2) return null;
  return countryToLocale[code] ?? 'en';
}

/** `Accept-Language` başlığından en iyi eşleşen dil. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const parsed = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q.split('=')[1]) || 0 : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parsed) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return null;
}
