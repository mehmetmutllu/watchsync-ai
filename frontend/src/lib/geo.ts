/**
 * Ziyaretçinin ülkesini tespit eder (middleware'de kullanılır).
 *
 * Kademeli strateji — ilk başarılı adım kazanır:
 *   1. Reverse proxy / CDN başlıkları (Cloudflare, Vercel, AWS, Fastly, Akamai,
 *      nginx GeoIP2 → `X-Geo-Country`)
 *   2. IP → ülke sorgusu (kendi sunucunda başlık yoksa; sonuç bellekte önbelleklenir)
 *   3. `Accept-Language` başlığı (çağıran tarafta)
 *   4. Varsayılan dil
 *
 * nginx (GeoIP2 modülü) ile başlık üretmek en hızlı yoldur — DEPLOYMENT.md'ye bakın.
 */

const COUNTRY_HEADERS = [
  'x-geo-country',            // kendi nginx/traefik kurulumun (GeoIP2)
  'cf-ipcountry',             // Cloudflare
  'x-vercel-ip-country',      // Vercel
  'cloudfront-viewer-country',// AWS CloudFront
  'fastly-client-country',    // Fastly
  'x-akamai-edgescape',       // Akamai (country_code=XX biçiminde)
  'x-country-code',           // genel amaçlı
];

export function countryFromHeaders(headers: Headers): string | null {
  for (const name of COUNTRY_HEADERS) {
    const raw = headers.get(name);
    if (!raw) continue;
    if (name === 'x-akamai-edgescape') {
      const m = raw.match(/country_code=([A-Za-z]{2})/);
      if (m) return m[1].toUpperCase();
      continue;
    }
    const code = raw.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1') return code;
  }
  return null;
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0],
    headers.get('x-client-ip'),
  ];
  for (const ip of candidates) {
    const value = ip?.trim();
    if (value) return value;
  }
  return null;
}

/** Özel / yerel ağ adresleri için IP sorgusu yapılmaz. */
export function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (/^(fc|fd|fe80)/i.test(ip)) return true;
  return false;
}

/* ---------------- IP → ülke sorgusu (önbellekli) ---------------- */

type CacheEntry = { country: string | null; expires: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat
const CACHE_MAX = 5000;
const LOOKUP_TIMEOUT_MS = Number(process.env.GEO_LOOKUP_TIMEOUT_MS ?? 1200);

/** Anahtarsız, HTTPS destekleyen sağlayıcılar. Sırayla denenir. */
type ProviderPayload = Record<string, unknown>;

const PROVIDERS: Array<(ip: string) => { url: string; pick: (data: ProviderPayload) => string | null }> = [
  (ip) => ({
    url: `https://get.geojs.io/v1/ip/country/${encodeURIComponent(ip)}.json`,
    pick: (d) => (typeof d.country === 'string' ? d.country : null),
  }),
  (ip) => ({
    url: `https://ipwho.is/${encodeURIComponent(ip)}?fields=country_code,success`,
    pick: (d) =>
      d.success === false || typeof d.country_code !== 'string' ? null : d.country_code,
  }),
];

export async function countryFromIp(ip: string): Promise<string | null> {
  if (process.env.GEO_IP_LOOKUP === 'off') return null;
  if (!ip || isPrivateIp(ip)) return null;

  const hit = cache.get(ip);
  if (hit && hit.expires > Date.now()) return hit.country;

  for (const build of PROVIDERS) {
    const { url, pick } = build(ip);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = (await res.json()) as ProviderPayload;
      const raw = pick(data);
      const code = typeof raw === 'string' ? raw.trim().toUpperCase() : null;
      if (code && /^[A-Z]{2}$/.test(code)) {
        remember(ip, code);
        return code;
      }
    } catch {
      // sağlayıcı yanıt vermedi → sıradakini dene
    }
  }

  remember(ip, null); // negatif sonucu da önbelleğe al (tekrar tekrar denemeyelim)
  return null;
}

function remember(ip: string, country: string | null) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(ip, { country, expires: Date.now() + CACHE_TTL_MS });
}
