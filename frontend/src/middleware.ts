import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const apiOrigin = apiUrl.replace(/\/api\/?$/, '');
const isDev = process.env.NODE_ENV !== 'production';

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

export default function middleware(request: NextRequest) {
  // Common geolocation headers from Vercel, Cloudflare, AWS, etc.
  const country = request.headers.get('x-vercel-ip-country') || 
                  request.headers.get('cf-ipcountry') || 
                  request.headers.get('cloudfront-viewer-country') || 
                  '';
  
  // If we can determine the country, we can override the accept-language header
  // so next-intl automatically defaults to the correct locale based on country
  if (country) {
    const countryCode = country.toUpperCase();
    
    // Check if user already has a preferred locale saved in cookies
    const hasLocaleCookie = request.cookies.has('NEXT_LOCALE');
    
    if (!hasLocaleCookie) {
      if (countryCode === 'DE') {
        request.headers.set('accept-language', 'de,en;q=0.9');
      } else if (countryCode === 'TR') {
        request.headers.set('accept-language', 'tr,en;q=0.9');
      } else {
        request.headers.set('accept-language', 'de');
      }
    }
  }

  // Per-request CSP nonce. Set on the forwarded request headers (next-intl copies
  // them into its rewrite/next response, so Next.js SSR applies the nonce to its
  // scripts) and on the outgoing response so the browser enforces it.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);
  request.headers.set('x-nonce', nonce);
  request.headers.set('Content-Security-Policy', csp);

  const response = intlMiddleware(request);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(tr|en|de)/:path*', '/((?!api|_next/static|_next/image|favicon.ico|sanctum|outputs|storage).*)']
};
