/**
 * Route planner — server-side only
 *
 * Given an ordered (or to-be-ordered) list of blocks for a collection run,
 * computes a suggested visiting order using nearest-neighbour heuristic,
 * then fetches real driving distances for consecutive legs via OneMap /route.
 *
 * Design:
 *   1. Nearest-neighbour on straight-line Haversine distance (no API calls)
 *      → produces initial suggested order cheaply
 *   2. OneMap /route called ONLY for consecutive legs in the suggested order
 *      (N-1 calls for N stops), not for every pair (N² calls)
 *   3. On coordinator drag-reorder, only the two affected legs are recomputed
 *      (not the whole route)
 */

import { oneMapRoute } from './onemap';
import type { BlockRecord } from './campaign-blocks';

export interface RouteLeg {
  fromBlockId: string;
  toBlockId: string;
  distanceM: number;   // metres, from OneMap
  timeS: number;       // seconds, from OneMap
}

export interface RouteStop {
  stop: number;
  blockId: string;
  blockNumber: string;
  streetName: string;
  lat: number;
  lng: number;
  pledgeCount: number;
  legToNext: RouteLeg | null; // null for the final stop
}

export interface RoutePlan {
  stops: RouteStop[];
  totalDistanceM: number;
  totalTimeS: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Haversine distance (metres) — for sorting, no API needed
// ─────────────────────────────────────────────────────────────────────────────
function haversineM(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R = 6_371_000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
// Nearest-neighbour heuristic (no API calls)
// ─────────────────────────────────────────────────────────────────────────────
function nearestNeighbourOrder(blocks: BlockRecord[]): BlockRecord[] {
  if (blocks.length <= 1) return [...blocks];

  // Filter blocks with valid coordinates
  const withCoords = blocks.filter((b) => b.lat != null && b.lng != null);
  const noCoords   = blocks.filter((b) => b.lat == null || b.lng == null);

  if (withCoords.length === 0) return [...blocks];

  // Start from the southernmost block (lowest lat — closest to town centre for Yishun)
  const sorted = [...withCoords].sort((a, b) => (a.lat ?? 0) - (b.lat ?? 0));
  const visited = new Set<string>();
  const order: BlockRecord[] = [];
  let current = sorted[0];

  while (order.length < withCoords.length) {
    visited.add(current.block_id);
    order.push(current);

    // Find nearest unvisited
    let nearestDist = Infinity;
    let nearest: BlockRecord | null = null;

    for (const b of withCoords) {
      if (visited.has(b.block_id)) continue;
      const d = haversineM(
        [current.lat!, current.lng!],
        [b.lat!, b.lng!]
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearest = b;
      }
    }

    if (!nearest) break;
    current = nearest;
  }

  // Append blocks with no coordinates at the end
  return [...order, ...noCoords];
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch route distance for a single leg (OneMap /route — drive)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchLeg(
  from: BlockRecord,
  to: BlockRecord
): Promise<{ distanceM: number; timeS: number }> {
  if (!from.lat || !from.lng || !to.lat || !to.lng) {
    // Fall back to straight-line estimate if coords missing
    const d = from.lat && from.lng && to.lat && to.lng
      ? haversineM([from.lat, from.lng], [to.lat, to.lng])
      : 0;
    return { distanceM: d, timeS: Math.round(d / 10) }; // ~10 m/s walking estimate
  }

  try {
    const result = await oneMapRoute(
      [from.lat, from.lng],
      [to.lat, to.lng],
      'drive'
    );
    return {
      distanceM: result.route_summary?.total_distance ?? 0,
      timeS:     result.route_summary?.total_time     ?? 0,
    };
  } catch (err) {
    console.warn(`[RoutePlanner] OneMap /route failed for leg ${from.block_number}→${to.block_number}:`, err);
    // Fall back to Haversine
    const d = haversineM([from.lat, from.lng], [to.lat, to.lng]);
    return { distanceM: d, timeS: Math.round(d / 10) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: compute full route plan for a run
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given an array of block records (with pledge counts), returns a RoutePlan
 * with nearest-neighbour ordering and OneMap real distances for each leg.
 *
 * @param blocks   Array of blocks to visit (from resolveCampaignBlocks or run.area_blocks)
 * @param pledgeCounts  Map of block_id → number of pledges at that block for this run
 */
export async function computeRoutePlan(
  blocks: BlockRecord[],
  pledgeCounts: Map<string, number>
): Promise<RoutePlan> {
  // 1. Order blocks with nearest-neighbour heuristic
  const ordered = nearestNeighbourOrder(blocks);

  // 2. Fetch legs sequentially (N-1 OneMap calls)
  const stops: RouteStop[] = [];
  let totalDistanceM = 0;
  let totalTimeS = 0;

  for (let i = 0; i < ordered.length; i++) {
    const block = ordered[i];
    const isLast = i === ordered.length - 1;

    let legToNext: RouteLeg | null = null;

    if (!isLast) {
      const next = ordered[i + 1];
      const { distanceM, timeS } = await fetchLeg(block, next);
      totalDistanceM += distanceM;
      totalTimeS     += timeS;
      legToNext = {
        fromBlockId: block.block_id,
        toBlockId:   next.block_id,
        distanceM,
        timeS,
      };
    }

    stops.push({
      stop:        i + 1,
      blockId:     block.block_id,
      blockNumber: block.block_number,
      streetName:  block.street_name,
      lat:         block.lat ?? 0,
      lng:         block.lng ?? 0,
      pledgeCount: pledgeCounts.get(block.block_id) ?? 0,
      legToNext,
    });
  }

  return { stops, totalDistanceM, totalTimeS };
}

/**
 * Recompute only the two legs affected by a drag-reorder.
 * Call this when the coordinator moves stop at `fromIndex` to `toIndex`.
 *
 * @param currentStops  The current RouteStop[] (after the reorder is applied in UI)
 * @param affectedIndices  Indices of the two re-positioned stops [lower, higher]
 * @param blocks  Full block record map (block_id → BlockRecord)
 */
export async function recomputeAffectedLegs(
  currentStops: RouteStop[],
  affectedIndices: [number, number],
  blocks: Map<string, BlockRecord>
): Promise<RouteStop[]> {
  const updated = [...currentStops];
  const [lower, higher] = affectedIndices.sort((a, b) => a - b);

  // Recompute leg from (lower-1) → lower if lower > 0
  // Recompute leg from higher → (higher+1) if higher < length-1
  const indicesToUpdate = new Set<number>();
  if (lower > 0)                          indicesToUpdate.add(lower - 1);
  if (higher < currentStops.length - 1)   indicesToUpdate.add(higher);
  indicesToUpdate.add(lower); // leg from lower → lower+1

  for (const idx of indicesToUpdate) {
    if (idx >= updated.length - 1) continue; // last stop has no outgoing leg
    const fromBlock = blocks.get(updated[idx].blockId);
    const toBlock   = blocks.get(updated[idx + 1].blockId);
    if (!fromBlock || !toBlock) continue;

    const { distanceM, timeS } = await fetchLeg(fromBlock, toBlock);
    updated[idx] = {
      ...updated[idx],
      legToNext: {
        fromBlockId: updated[idx].blockId,
        toBlockId:   updated[idx + 1].blockId,
        distanceM,
        timeS,
      },
    };
  }

  // Clear last stop's leg
  updated[updated.length - 1] = { ...updated[updated.length - 1], legToNext: null };

  // Renumber stops
  return updated.map((s, i) => ({ ...s, stop: i + 1 }));
}

/** Format seconds into human-readable string, e.g. "1h 40m" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0)           return `${h}h`;
  return `${m}m`;
}

/** Format metres into human-readable string, e.g. "2.4 km" */
export function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}
