/**
 * GET /api/onemap/test-token
 *
 * Development-only verification endpoint.
 * Fetches a OneMap token and returns confirmation (NOT the token itself).
 * Remove or guard with auth before production deploy.
 */
import { NextResponse } from 'next/server';
import { getOneMapToken, oneMapSearch } from '@/lib/onemap';

export async function GET() {
  try {
    // Fetch token (triggers auth if cache is cold)
    const token = await getOneMapToken();

    // Do a quick test search to confirm the token works on an authenticated endpoint
    // (search itself is public, but this proves the service is reachable)
    const testResults = await oneMapSearch('118 ANG MO KIO AVE 4');

    return NextResponse.json({
      ok: true,
      tokenPreview: `${token.slice(0, 12)}… (${token.length} chars)`,
      testSearch: {
        query: '118 ANG MO KIO AVE 4',
        topResult: testResults[0]
          ? {
              address: testResults[0].ADDRESS,
              lat: testResults[0].LATITUDE,
              lng: testResults[0].LONGITUDE,
              postal: testResults[0].POSTAL,
            }
          : null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
