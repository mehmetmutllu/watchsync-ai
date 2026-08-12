import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { locales, defaultLocale, localeFromCountry, localeFromAcceptLanguage, type Locale } from './i18n/config';
import { countryFromHeaders, clientIpFromHeaders, countryFromIp } from './lib/geo';

const intlMiddleware = createMiddleware(routing);

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const apiOrigin = apiUrl.replace(/\/api\/?$/, '');
const isDev = process.env.NODE_ENV !== 'production';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const COUNTRY_COOKIE = 'WS_COUNTRY';

// 'strict-dynamic' + per-request nonce replaces 'unsafe-inline' in script-src so a
// smuggled inline <script> cannot execute. 'unsafe-eval' stays dev-only (HMR).
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${apiOrigin}`,
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

const LOCALE_PREFIX_RE = new RegExp(`^/(${locales.join('|')})(/|$)`);

function pathHasLocale(pathname: string): boolean {
  return LOCALE_PREFIX_RE.test(pathname);
}

/**
 * Ziyaretçi için dil belirle:
 *   1. NEXT_LOCALE çerezi (kullanıcı bilinçli seçim yaptıysa) — dokunulmaz
 *   2. URL'deki dil öneki — dokunulmaz
 *   3. Ülke (proxy başlığı → yoksa IP sorgusu)
 *   4. Accept-Language
 *   5. Varsayılan dil
 */
async function detectLocale(
  request: NextRequest
): Promise<{ locale: Locale | null; country: string | null }> {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return { locale: null, country: null }; // kullanıcı seçimi geçerli, karışma
  }

  if (pathHasLocale(request.nextUrl.pathname)) {
    return { locale: null, country: null }; // URL zaten dili söylüyor
  }

  let country = countryFromHeaders(request.headers);

  // Proxy başlığı yoksa: daha önce çözülmüş ülkeyi çerezden oku, yoksa IP'den sor.
  if (!country) {
    const cached = request.cookies.get(COUNTRY_COOKIE)?.value;
    if (cached && /^[A-Za-z]{2}$/.test(cached)) {
      country = cached.toUpperCase();
    } else {
      const ip = clientIpFromHeaders(request.headers);
      if (ip) country = await countryFromIp(ip);
    }
  }

  const byCountry = localeFromCountry(country);
  if (byCountry) return { locale: byCountry, country };

  const byHeader = localeFromAcceptLanguage(request.headers.get('accept-language'));
  return { locale: byHeader ?? defaultLocale, country };
}

export default async function middleware(request: NextRequest) {
  const { locale: detected, country } = await detectLocale(request);

  // Tespit edilen dili next-intl'in görebileceği tek yere yaz: Accept-Language.
  // Böylece yönlendirme mantığı tek bir yerde (next-intl) kalır.
  if (detected) {
    request.headers.set('accept-language', `${detected};q=1.0, en;q=0.5`);
  }

  // Per-request CSP nonce. Set on the forwarded request headers (next-intl copies
  // them into its rewrite/next response, so Next.js SSR applies the nonce to its
  // scripts) and on the outgoing response so the browser enforces it.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);
  request.headers.set('x-nonce', nonce);
  request.headers.set('Content-Security-Policy', csp);

  const response = (intlMiddleware(request) ?? NextResponse.next()) as NextResponse;
  response.headers.set('Content-Security-Policy', csp);

  // Çözülen ülkeyi çereze yaz — sonraki isteklerde IP sorgusu tekrarlanmasın.
  if (country && !request.cookies.get(COUNTRY_COOKIE)) {
    response.cookies.set(COUNTRY_COOKIE, country, {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

// DİKKAT: Next.js bu nesneyi derleme zamanında statik olarak okur —
// şablon dizgesi (`/(${locales.join('|')})/...`) KULLANILAMAZ, build kırılır.
// Dil listesi değişirse aşağıdaki satır da elle güncellenmelidir
// (kaynak: src/i18n/config.ts → locales).
export const config = {
  matcher: [
    '/',
    '/(tr|de|en|ar)/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|media|sanctum|outputs|storage).*)',
  ],
};
