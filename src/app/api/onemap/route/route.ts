/**
 * GET /api/onemap/route
 *
 * Server-side proxy for OneMap /route endpoint.
 * Client sends: ?fromLat=&fromLng=&toLat=&toLng=&routeType=drive
 * Server fetches token internally and proxies to OneMap — client never sees credentials.
 *
 * Returns: { distanceM, timeS, ok: true } or { ok: false, error }
 */
import { NextRequest, NextResponse } from 'next/server';
import { oneMapRoute } from '@/lib/onemap';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const fromLat    = parseFloat(searchParams.get('fromLat') ?? '');
  const fromLng    = parseFloat(searchParams.get('fromLng') ?? '');
  const toLat      = parseFloat(searchParams.get('toLat')   ?? '');
  const toLng      = parseFloat(searchParams.get('toLng')   ?? '');
  const routeType  = (searchParams.get('routeType') ?? 'drive') as 'drive' | 'walk' | 'cycle';

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
    return NextResponse.json(
      { ok: false, error: 'fromLat, fromLng, toLat, toLng are required numbers' },
      { status: 400 }
    );
  }

  try {
    const result = await oneMapRoute([fromLat, fromLng], [toLat, toLng], routeType);
    return NextResponse.json({
      ok: true,
      distanceM: result.route_summary?.total_distance,
      timeS:     result.route_summary?.total_time,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
