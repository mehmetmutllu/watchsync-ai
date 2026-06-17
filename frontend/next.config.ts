import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const apiOrigin = apiUrl.replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "api.watchsync.ai",
        pathname: "/storage/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    resolveAlias: {
      "@sentry/core": "./src/lib/sentry-stub.ts",
      "@sentry/nextjs": "./src/lib/sentry-stub.ts",
      "@sentry/node": "./src/lib/sentry-stub.ts",
      "@sentry/react": "./src/lib/sentry-stub.ts",
    },
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: blob: ${apiOrigin}`,
              `connect-src 'self' ${apiOrigin}`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // Static assets — uzun cache (sadece production)
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
            {
              source: "/fonts/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
    ];
  },
  async rewrites() {
    return [
      {
        source: "/sanctum/:path*",
        destination: `${apiOrigin}/sanctum/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
