import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseService } from '@/lib/supabase-server';
import AppScreen from '@/components/layout/AppScreen';
import CategoryBar from '@/components/CategoryBar';
import StatTile from '@/components/layout/StatTile';
import SectionLabel from '@/components/layout/SectionLabel';
import TrendChart from '@/components/TrendChart';
import DemandHeatmap from '@/components/DemandHeatmap';
import EmptyState from '@/components/layout/EmptyState';
import { POINTS_PER_PLEDGE } from '@/lib/constants';

// Order + colour for the pledge funnel stages.
const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: 'var(--amber)' },
  { key: 'confirmed', label: 'Collected', color: 'var(--green-success)' },
  { key: 'postponed', label: 'Postponed', color: 'var(--text-mid)' },
  { key: 'declined', label: 'Declined', color: 'var(--rust)' },
];

const DAY_MS = 86_400_000;

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const db = supabaseService();

  if (!user) {
    return (
      <AppScreen nav="coordinator" style={{ padding: 24, textAlign: 'center' }}>
        <p>You must be an organization member to view analytics.</p>
      </AppScreen>
    );
  }

  const { data: orgMember } = await (db.from('org_members') as any).select('org_id').eq('user_id', user.id).maybeSingle();

  if (!orgMember) {
    return (
      <AppScreen nav="coordinator" style={{ padding: 24, textAlign: 'center' }}>
        <p>You must be an organization member to view analytics.</p>
      </AppScreen>
    );
  }

  // Scoped to this org only, via collection_runs -> campaigns -> org_id.
  // Must disambiguate the FK: pledges has two FKs to collection_runs
  // (collection_run_id and postponed_to_run_id), so a bare
  // `collection_runs!inner(...)` embed fails with PGRST201.
  const { data: pledges, error: pledgesErr } = await (db.from('pledges') as any)
    .select('*, collection_runs!pledges_collection_run_id_fkey!inner(campaigns!inner(org_id))')
    .eq('collection_runs.campaigns.org_id', orgMember.org_id);

  if (pledgesErr) console.error('Analytics pledges query failed:', pledgesErr.message);

  const orgPledges = pledges || [];
  const confirmedPledges = orgPledges.filter((p: any) => p.status === 'confirmed');

  const totalPledges = orgPledges.length;
  const totalCollected = confirmedPledges.length;
  const uniqueResidents = new Set(confirmedPledges.map((p: any) => p.resident_id)).size;
  const pointsDistributed = totalCollected * POINTS_PER_PLEDGE;
  const completionRate = totalPledges > 0 ? Math.round((totalCollected / totalPledges) * 100) : 0;

  // ─── Pledge funnel + decline reasons ────────────────────────────
  const statusCounts: Record<string, number> = orgPledges.reduce((acc: any, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const maxStatus = Math.max(1, ...STATUS_META.map((s) => statusCounts[s.key] || 0));

  const declinedPledges = orgPledges.filter((p: any) => p.status === 'declined');
  const declineReasons: Record<string, number> = declinedPledges.reduce((acc: any, p: any) => {
    const r = p.decline_reason || 'Not specified';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const sortedDeclineReasons = Object.entries(declineReasons).sort((a: any, b: any) => b[1] - a[1]);

  // ─── What's coming in: category / condition / size mix ──────────
  // Everything residents offered that wasn't rejected (the live intake stream).
  const intakePledges = orgPledges.filter((p: any) => p.status !== 'declined');

  const mixOf = (fn: (p: any) => string) => {
    const acc: Record<string, number> = {};
    for (const p of intakePledges) {
      const key = fn(p) || 'Unspecified';
      acc[key] = (acc[key] || 0) + 1;
    }
    return Object.entries(acc).sort((a: any, b: any) => b[1] - a[1]);
  };
  const categoryMix = mixOf((p) => p.confirmed_category || p.ai_suggested_category);
  const conditionMix = mixOf((p) => p.confirmed_condition || p.ai_suggested_condition);
  const sizeMix = mixOf((p) => p.size_bucket);
  const intakeTotal = intakePledges.length;
  const twoCrewCount = intakePledges.filter((p: any) => p.needs_two_crew).length;

  // ─── Pledges over time (cumulative daily) ───────────────────────
  const perDay: Record<number, number> = {};
  let minDay = Infinity;
  let maxDay = -Infinity;
  for (const p of orgPledges) {
    if (!p.created_at) continue;
    const d = new Date(p.created_at);
    if (isNaN(d.getTime())) continue;
    d.setHours(0, 0, 0, 0);
    const key = d.getTime();
    perDay[key] = (perDay[key] || 0) + 1;
    if (key < minDay) minDay = key;
    if (key > maxDay) maxDay = key;
  }
  const trendPoints: { label: string; value: number }[] = [];
  if (isFinite(minDay) && isFinite(maxDay) && maxDay > minDay) {
    let cum = 0;
    for (let t = minDay; t <= maxDay; t += DAY_MS) {
      cum += perDay[t] || 0;
      trendPoints.push({
        label: new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: cum,
      });
    }
  }

  // ─── Demand map, scoped to the org's own campaign area ──────────
  const { data: interestRows } = await (db.from('donation_interests') as any)
    .select('block_id, category')
    .eq('status', 'open');
  const openInterests = interestRows || [];

  const { data: orgCampaigns } = await (db.from('campaigns') as any)
    .select('area_mode, area_reference, area_blocks')
    .eq('org_id', orgMember.org_id);

  const townRefs = new Set<string>();
  const areaBlockIds = new Set<string>();
  for (const c of orgCampaigns || []) {
    if (c.area_mode === 'whole_area' && c.area_reference) townRefs.add(c.area_reference);
    else if (Array.isArray(c.area_blocks)) c.area_blocks.forEach((id: string) => areaBlockIds.add(id));
  }

  // Blocks that belong to this org's coverage area.
  const orgBlocksMap = new Map<string, any>();
  if (townRefs.size > 0) {
    const { data } = await (db.from('blocks') as any)
      .select('block_id, block_number, street_name, lat, lng')
      .in('town', [...townRefs]);
    (data || []).forEach((b: any) => orgBlocksMap.set(b.block_id, b));
  }
  if (areaBlockIds.size > 0) {
    const { data } = await (db.from('blocks') as any)
      .select('block_id, block_number, street_name, lat, lng')
      .in('block_id', [...areaBlockIds]);
    (data || []).forEach((b: any) => orgBlocksMap.set(b.block_id, b));
  }

  // Fall back to all blocks only when the org has no defined area yet.
  let demandSourceBlocks: any[];
  if (orgBlocksMap.size > 0) {
    demandSourceBlocks = [...orgBlocksMap.values()];
  } else {
    const { data } = await (db.from('blocks') as any).select('block_id, block_number, street_name, lat, lng');
    demandSourceBlocks = data || [];
  }
  const areaBlockIdSet = new Set(demandSourceBlocks.map((b) => b.block_id));

  const areaInterests = openInterests.filter((i: any) => areaBlockIdSet.has(i.block_id));
  const areaCounts: Record<string, number> = {};
  const areaCats: Record<string, Record<string, number>> = {};
  for (const i of areaInterests) {
    areaCounts[i.block_id] = (areaCounts[i.block_id] || 0) + 1;
    const cat = i.category || 'Other';
    areaCats[i.block_id] = areaCats[i.block_id] || {};
    areaCats[i.block_id][cat] = (areaCats[i.block_id][cat] || 0) + 1;
  }
  const demandBlocks = demandSourceBlocks
    .filter((b) => areaCounts[b.block_id] > 0)
    .map((b) => ({ ...b, interestCount: areaCounts[b.block_id], categoryBreakdown: areaCats[b.block_id] }))
    .sort((a, b) => b.interestCount - a.interestCount);

  const demandCategoryMix = Object.entries(
    areaInterests.reduce((acc: any, i: any) => {
      const cat = i.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <AppScreen nav="coordinator">
      <div style={{ padding: '14px 22px', background: '#fff', borderBottom: '1px solid var(--card-border)' }}>
        <h1 style={{ font: '700 24px var(--font-serif)', color: 'var(--teal)', margin: 0 }}>Analytics</h1>
        <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)' }}>Your community impact at a glance</div>
      </div>

      <div style={{ padding: '24px 22px' }}>
        {/* ── Impact summary ── */}
        <SectionLabel style={{ marginBottom: 16 }}>Impact summary</SectionLabel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card--hero" style={{ background: 'var(--teal)', color: '#fff', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ font: '800 14px var(--font-ui)', opacity: 0.85 }}>Total collected</div>
              <div style={{ font: '700 36px var(--font-serif)', lineHeight: 1.1 }}>{totalCollected} items</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8 12 4l9 4-9 4-9-4z" /><path d="M3 8v9l9 4 9-4V8" /><path d="M12 12v9" />
              </svg>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatTile value={uniqueResidents} label="Active donors" accent="var(--rust)" />
            <StatTile value={pointsDistributed} label="Points given" accent="var(--amber)" />
            <StatTile value={`${completionRate}%`} label="Completion rate" accent="var(--teal)" />
            <StatTile value={twoCrewCount} label="Need 2-person crew" accent="var(--teal)" />
          </div>
        </div>

        {/* ── Pledges over time ── */}
        <SectionLabel style={{ margin: '32px 0 16px' }}>Pledges over time</SectionLabel>
        <div className="card" style={{ padding: 20 }}>
          {trendPoints.length >= 2 ? (
            <>
              <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 12 }}>
                Cumulative pledges received — {trendPoints[trendPoints.length - 1].value} to date
              </div>
              <TrendChart points={trendPoints} accent="var(--teal)" />
            </>
          ) : (
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center' }}>
              Not enough history yet — the trend appears once pledges span more than one day.
            </div>
          )}
        </div>

        {/* ── Pledge funnel + decline reasons ── */}
        <SectionLabel style={{ margin: '32px 0 16px' }}>Pledge funnel</SectionLabel>
        <div className="card" style={{ padding: 20 }}>
          {totalPledges === 0 ? (
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center' }}>No pledges yet.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {STATUS_META.map((s) => {
                  const count = statusCounts[s.key] || 0;
                  const pct = Math.round((count / maxStatus) * 100);
                  return (
                    <div key={s.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)' }}>{s.label}</span>
                        <span style={{ font: '800 14px var(--font-serif)', color: s.color }}>{count}</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 10 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.max(count > 0 ? 4 : 0, pct)}%`, background: s.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {sortedDeclineReasons.length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--card-border)', margin: '20px 0' }} />
                  <SectionLabel style={{ marginBottom: 10 }}>Why items were declined</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sortedDeclineReasons.map(([reason, count]: any) => (
                      <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', font: '700 13px var(--font-ui)', color: 'var(--text-dark)' }}>
                        <span>{reason}</span>
                        <span style={{ color: 'var(--rust)' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── What's coming in ── */}
        <SectionLabel style={{ margin: '32px 0 16px' }}>What&apos;s coming in</SectionLabel>
        <div className="card" style={{ padding: 20 }}>
          {intakeTotal === 0 ? (
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center' }}>Nothing pledged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <SectionLabel style={{ marginBottom: 12 }}>By category</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {categoryMix.map(([label, count]: any) => (
                    <CategoryBar key={label} label={label} count={count} total={intakeTotal} />
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel style={{ marginBottom: 12 }}>By condition</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {conditionMix.map(([label, count]: any) => (
                    <CategoryBar key={label} label={label} count={count} total={intakeTotal} color="var(--amber)" />
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel style={{ marginBottom: 12 }}>By size</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {sizeMix.map(([label, count]: any) => (
                    <CategoryBar key={label} label={label} count={count} total={intakeTotal} color="var(--rust)" />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Demand signal (map, scoped to org area) ── */}
        <SectionLabel style={{ margin: '32px 0 16px' }}>Demand in your area</SectionLabel>
        {demandBlocks.length === 0 ? (
          <EmptyState title="No open demand right now" description="Blocks in your campaign area with residents waiting to give will appear here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DemandHeatmap blocks={demandBlocks} />
            {demandCategoryMix.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <SectionLabel style={{ marginBottom: 12 }}>What residents are waiting to give</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {demandCategoryMix.map(([label, count]: any) => (
                    <CategoryBar key={label} label={label} count={count} total={areaInterests.length} color="var(--rust)" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppScreen>
  );
}
