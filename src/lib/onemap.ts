/**
 * OneMap Token Service — server-side only
 *
 * Fetches a JWT from OneMap's /api/auth/post/getToken endpoint,
 * caches it in memory with its expiry, and auto-refreshes when stale.
 *
 * Token validity: 3 days (72 hours) per OneMap docs.
 * We refresh proactively when < 30 minutes remain.
 *
 * IMPORTANT: This module must NEVER be imported from a client component.
 * All OneMap authenticated calls go through your own /api/onemap/* proxy routes.
 */

const ONEMAP_AUTH_URL = 'https://www.onemap.gov.sg/api/auth/post/getToken';
const ONEMAP_BASE_URL = 'https://www.onemap.gov.sg';

interface TokenCache {
  token: string;
  expiresAt: number; // Unix ms
}

// Module-level cache (survives across requests in the same Node.js process)
let tokenCache: TokenCache | null = null;

/**
 * Returns a valid OneMap access token, refreshing if expired or near expiry.
 * Throws if credentials are missing or the request fails.
 */
export async function getOneMapToken(): Promise<string> {
  const now = Date.now();
  const refreshBuffer = 30 * 60 * 1000; // 30 minutes

  if (tokenCache && tokenCache.expiresAt - now > refreshBuffer) {
    return tokenCache.token;
  }

  const email = process.env.ONEMAP_EMAIL;
  const password = process.env.ONEMAP_PASSWORD;

  if (!email || !password) {
    throw new Error(
      '[OneMap] ONEMAP_EMAIL or ONEMAP_PASSWORD env vars are not set. ' +
        'Add them to .env.local (server-side only, never NEXT_PUBLIC_).'
    );
  }

  const res = await fetch(ONEMAP_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    // Don't cache this fetch — we manage caching ourselves
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `[OneMap] Token request failed: HTTP ${res.status} — ${body}`
    );
  }

  const data: { access_token: string; expiry_timestamp: string } =
    await res.json();

  if (!data.access_token) {
    throw new Error('[OneMap] Token response missing access_token field.');
  }

  // expiry_timestamp is an ISO-8601 or Unix string; parse defensively
  const expiresAt = parseOneMapExpiry(data.expiry_timestamp);

  tokenCache = { token: data.access_token, expiresAt };

  console.log(
    `[OneMap] Token refreshed. Expires at ${new Date(expiresAt).toISOString()}`
  );

  return data.access_token;
}

/**
 * Parses OneMap's expiry_timestamp field.
 * OneMap returns it as a Unix timestamp string (seconds) or ISO string.
 */
function parseOneMapExpiry(raw: string): number {
  const asNumber = Number(raw);
  if (!isNaN(asNumber)) {
    // Heuristic: if < 1e12 it's Unix seconds, else milliseconds
    return asNumber < 1e12 ? asNumber * 1000 : asNumber;
  }
  return new Date(raw).getTime();
}

// ─────────────────────────────────────────────────────────────────────────────
// OneMap API helpers — all server-side only
// ─────────────────────────────────────────────────────────────────────────────

export interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string; // SVY21 easting
  Y: string; // SVY21 northing
  LATITUDE: string;
  LONGITUDE: string;
  LONGTITUDE: string; // OneMap typo — same as LONGITUDE
}

/**
 * Geocode a search string via OneMap /api/common/elastic/search
 * (no auth needed — public endpoint).
 */
export async function oneMapSearch(
  query: string,
  pageNum = 1
): Promise<OneMapSearchResult[]> {
  const url = new URL(`${ONEMAP_BASE_URL}/api/common/elastic/search`);
  url.searchParams.set('searchVal', query);
  url.searchParams.set('returnGeom', 'Y');
  url.searchParams.set('getAddrDetails', 'Y');
  url.searchParams.set('pageNum', String(pageNum));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`[OneMap] Search failed: HTTP ${res.status}`);

  const data = await res.json();
  return (data.results as OneMapSearchResult[]) ?? [];
}

export interface OneMapRouteResult {
  status_message: string;
  route_geometry: string;   // encoded polyline
  status: number;
  route_instructions: unknown[];
  route_name: string[];
  route_summary: {
    start_point: string;
    end_point: string;
    total_time: number;    // seconds
    total_distance: number; // metres
  };
  viaRoute: string;
}

/**
 * Get driving route between two lat/lng points.
 * Requires auth token — uses getOneMapToken() internally.
 *
 * @param from [lat, lng]
 * @param to   [lat, lng]
 * @param routeType 'drive' | 'walk' | 'cycle' (default: 'drive')
 */
export async function oneMapRoute(
  from: [number, number],
  to: [number, number],
  routeType: 'drive' | 'walk' | 'cycle' = 'drive'
): Promise<OneMapRouteResult> {
  const token = await getOneMapToken();

  const url = new URL(`${ONEMAP_BASE_URL}/api/public/routingsvc/route`);
  url.searchParams.set('start', `${from[0]},${from[1]}`);
  url.searchParams.set('end', `${to[0]},${to[1]}`);
  url.searchParams.set('routeType', routeType);

  const res = await fetch(url.toString(), {
    headers: { Authorization: token },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[OneMap] Route request failed: HTTP ${res.status} — ${body}`);
  }

  return res.json();
}
