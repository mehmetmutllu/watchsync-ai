import { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

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

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(tr|en|de)/:path*', '/((?!api|_next/static|_next/image|favicon.ico|sanctum|outputs|storage).*)']
};
