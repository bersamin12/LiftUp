import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseService } from '@/lib/supabase-server';
import AppScreen from '@/components/layout/AppScreen';
import CategoryBar from '@/components/CategoryBar';
import StatusPill from '@/components/layout/StatusPill';

const FUNNEL_TONE: Record<string, 'pending' | 'success' | 'amber' | 'neutral'> = {
  pending: 'pending',
  confirmed: 'success',
  declined: 'amber',
  postponed: 'neutral',
};

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
  // `collection_runs!inner(...)` embed fails with PGRST201 and silently
  // returns no data (the error was being swallowed by only destructuring
  // `data`) — this was the root cause of every stat on this page showing 0.
  const { data: pledges, error: pledgesErr } = await (db.from('pledges') as any)
    .select('*, collection_runs!pledges_collection_run_id_fkey!inner(campaigns!inner(org_id))')
    .eq('collection_runs.campaigns.org_id', orgMember.org_id);

  if (pledgesErr) console.error('Analytics pledges query failed:', pledgesErr.message);

  const orgPledges = pledges || [];
  const confirmedPledges = orgPledges.filter((p: any) => p.status === 'confirmed');

  const totalCollected = confirmedPledges.length;
  const uniqueResidents = new Set(confirmedPledges.map((p: any) => p.resident_id)).size;
  const pointsDistributed = totalCollected * 50;

  const categories = confirmedPledges.reduce((acc: any, p: any) => {
    const cat = p.confirmed_category || p.ai_suggested_category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const sortedCategories = Object.entries(categories).sort((a: any, b: any) => b[1] - a[1]);

  // Pledge status funnel across every status, not just confirmed
  const statusCounts = orgPledges.reduce((acc: any, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const funnelOrder = ['pending', 'confirmed', 'declined', 'postponed'];

  // Logistics load: active (pending/confirmed) pledges needing extra handling
  const activePledges = orgPledges.filter((p: any) => p.status === 'pending' || p.status === 'confirmed');
  const bulkyCount = activePledges.filter((p: any) => p.size_bucket === 'Large / bulky').length;
  const twoCrewCount = activePledges.filter((p: any) => p.needs_two_crew).length;

  // Demand signal: open donor-interest registrations, org-agnostic per the interest RLS model
  const { data: interestRows } = await (db.from('donation_interests') as any)
    .select('block_id, category')
    .eq('status', 'open');
  const openInterests = interestRows || [];

  const interestCategories = openInterests.reduce((acc: any, i: any) => {
    const cat = i.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const sortedInterestCategories = Object.entries(interestCategories).sort((a: any, b: any) => b[1] - a[1]);

  const blockCounts = openInterests.reduce((acc: any, i: any) => {
    acc[i.block_id] = (acc[i.block_id] || 0) + 1;
    return acc;
  }, {});
  const topBlockIds = Object.entries(blockCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
  let topBlocks: any[] = [];
  if (topBlockIds.length > 0) {
    const { data: blocksData } = await (db.from('blocks') as any)
      .select('block_id, block_number, street_name')
      .in('block_id', topBlockIds.map(([id]) => id));
    topBlocks = topBlockIds.map(([id, count]) => {
      const block = (blocksData || []).find((b: any) => b.block_id === id);
      return { id, count, block };
    });
  }

  return (
    <AppScreen nav="coordinator">
      <div style={{ padding: '12px 22px', background: '#fff', borderBottom: '1px solid var(--card-border)' }}>
        <h1 style={{ font: '700 24px var(--font-serif)', color: 'var(--teal)', margin: 0 }}>Analytics</h1>
        <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)' }}>Community Impact</div>
      </div>

      <div style={{ padding: '24px 22px' }}>
        <h2 style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.5px', margin: '0 0 16px' }}>YOUR ORG&apos;S STATS</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--teal)', color: '#fff', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ font: '800 14px var(--font-ui)', opacity: 0.8 }}>Total Collected</div>
              <div style={{ font: '700 36px var(--font-serif)', lineHeight: 1.1 }}>{totalCollected} items</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ font: '700 28px var(--font-serif)', color: 'var(--rust)' }}>{uniqueResidents}</div>
              <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginTop: 4 }}>ACTIVE DONORS</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ font: '700 28px var(--font-serif)', color: 'var(--amber)' }}>{pointsDistributed}</div>
              <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginTop: 4 }}>POINTS GIVEN</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ font: '700 28px var(--font-serif)', color: 'var(--teal)' }}>{bulkyCount}</div>
              <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginTop: 4 }}>LARGE / BULKY ITEMS</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ font: '700 28px var(--font-serif)', color: 'var(--teal)' }}>{twoCrewCount}</div>
              <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginTop: 4 }}>NEED 2-PERSON CREW</div>
            </div>
          </div>
        </div>

        <h2 style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.5px', margin: '32px 0 16px' }}>PLEDGE STATUS</h2>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {orgPledges.length === 0 ? (
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>No pledges yet.</div>
          ) : (
            funnelOrder.map(status => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusPill tone={FUNNEL_TONE[status]}>{status}</StatusPill>
                <span style={{ font: '800 14px var(--font-serif)', color: 'var(--text-dark)' }}>{statusCounts[status] || 0}</span>
              </div>
            ))
          )}
        </div>

        <h2 style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.5px', margin: '32px 0 16px' }}>ITEM BREAKDOWN</h2>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20 }}>
          {sortedCategories.length === 0 ? (
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center' }}>No items collected yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sortedCategories.map(([cat, count]: any) => (
                <CategoryBar key={cat} label={cat} count={count} total={totalCollected} />
              ))}
            </div>
          )}
        </div>

        <h2 style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.5px', margin: '32px 0 16px' }}>DEMAND SIGNAL</h2>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20 }}>
          {sortedInterestCategories.length === 0 ? (
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center' }}>No registered interest right now.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sortedInterestCategories.map(([cat, count]: any) => (
                  <CategoryBar key={cat} label={cat} count={count} total={openInterests.length} color="var(--rust)" />
                ))}
              </div>

              <div style={{ height: 1, background: '#f0eee8', margin: '20px 0' }}></div>

              <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 10 }}>TOP BLOCKS WAITING</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topBlocks.map(({ id, count, block }) => (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', font: '700 13px var(--font-ui)', color: 'var(--text-dark)' }}>
                    <span>{block ? `Blk ${block.block_number} ${block.street_name}` : 'Unknown block'}</span>
                    <span style={{ color: 'var(--rust)' }}>{count} interested</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppScreen>
  );
}
