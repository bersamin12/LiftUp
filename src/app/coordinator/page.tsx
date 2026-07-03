import Link from 'next/link';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { signOut } from '@/app/actions/auth';
import AppScreen from '@/components/layout/AppScreen';
import EmptyState from '@/components/layout/EmptyState';
import StatusPill from '@/components/layout/StatusPill';
import DemandHeatmap from '@/components/DemandHeatmap';

async function getOrgContext() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = supabaseService();
  const { data: orgMember } = await (db.from('org_members') as any).select('org_id').eq('user_id', user.id).single();
  if (!orgMember) return null;

  const { data: org } = await (db.from('organizations') as any).select('*').eq('id', orgMember.org_id).single();

  if (org && org.name === 'Pending Org') {
    const { redirect } = await import('next/navigation');
    redirect('/org-setup');
  }

  // Fetch campaigns for this org
  const { data: campaigns } = await (db.from('campaigns') as any)
    .select('*')
    .eq('org_id', orgMember.org_id)
    .order('created_at', { ascending: false });

  // Disambiguate the FK: pledges has two FKs to collection_runs
  // (collection_run_id and postponed_to_run_id), so this must name the
  // exact constraint or PostgREST errors with PGRST201 and this silently
  // returns null/0 (only `count` was being destructured, hiding the error).
  const { count: openPledges } = await (db.from('pledges') as any)
    .select('*, collection_runs!pledges_collection_run_id_fkey!inner(campaigns!inner(org_id))', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('collection_runs.campaigns.org_id', orgMember.org_id);

  // Demand heatmap: blocks with at least one open donor-interest signal, system-wide
  const { data: allBlocks } = await (db.from('blocks') as any).select('block_id, block_number, street_name, lat, lng');
  const { data: interestRows } = await (db.from('donation_interests') as any)
    .select('block_id, category')
    .eq('status', 'open');

  const interestCounts: Record<string, number> = {};
  const interestCategories: Record<string, Record<string, number>> = {};
  for (const row of interestRows || []) {
    interestCounts[row.block_id] = (interestCounts[row.block_id] || 0) + 1;
    const cat = row.category || 'Other';
    interestCategories[row.block_id] = interestCategories[row.block_id] || {};
    interestCategories[row.block_id][cat] = (interestCategories[row.block_id][cat] || 0) + 1;
  }

  const demandBlocks = (allBlocks || [])
    .filter((b: any) => interestCounts[b.block_id] > 0)
    .map((b: any) => ({ ...b, interestCount: interestCounts[b.block_id], categoryBreakdown: interestCategories[b.block_id] }))
    .sort((a: any, b: any) => b.interestCount - a.interestCount);

  return { org, campaigns: campaigns || [], openPledges: openPledges || 0, demandBlocks };
}

export default async function CoordinatorDashboard() {
  const context = await getOrgContext();

  if (!context) {
    return (
      <AppScreen style={{ padding: 24, textAlign: 'center' }}>
        <h2>Unauthorized</h2>
        <p>You must be an organization member to view this page.</p>
        <form action={signOut} style={{ marginTop: 24 }}>
          <button type="submit" className="btn-primary">Log out</button>
        </form>
      </AppScreen>
    );
  }

  const { org, campaigns, openPledges, demandBlocks } = context;
  const liveCampaigns = campaigns.filter((c: any) => c.status === 'active').length;

  return (
    <AppScreen nav="coordinator">
      <div style={{ padding: '24px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)' }}>Coordinator</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ font: '700 22px var(--font-serif)', color: 'var(--teal)' }}>{org.name}</span>
            {org.verification_status === 'verified' ? (
              <span className="verified-badge"></span>
            ) : (
              <StatusPill tone="pending">Pending review</StatusPill>
            )}
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: 999, padding: '6px 12px', font: '700 12px var(--font-ui)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            Log out
          </button>
        </form>
      </div>

      <div className="card" style={{ margin: '16px 22px 0', padding: '13px 16px', display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: '700 20px var(--font-serif)', color: 'var(--teal)' }}>{openPledges}</div>
          <div style={{ font: '700 10px var(--font-ui)', color: 'var(--text-muted)' }}>open pledges</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: '700 20px var(--font-serif)', color: 'var(--teal)' }}>{liveCampaigns}</div>
          <div style={{ font: '700 10px var(--font-ui)', color: 'var(--text-muted)' }}>live campaigns</div>
        </div>
      </div>

      <div style={{ padding: '24px 22px 0' }}>
        <h2 className="section-label" style={{ margin: '0 0 16px' }}>Demand heatmap</h2>
        <DemandHeatmap blocks={demandBlocks} />
      </div>

      <div style={{ padding: '24px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-label" style={{ margin: 0 }}>Active campaigns</h2>
          <Link href="/coordinator/campaign/new" style={{ font: '800 13px var(--font-ui)', color: 'var(--teal)', textDecoration: 'none' }}>
            + New Campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No campaigns yet"
            description="Start your first donation drive!"
            action={<Link href="/coordinator/campaign/new" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Create Campaign</Link>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map((camp: any, i: number) => (
              <Link key={camp.id} href={`/coordinator/campaign/${camp.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card--interactive fade-in" style={{ animationDelay: `${i * 60}ms`, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ font: '700 18px var(--font-serif)', color: 'var(--text-dark)' }}>{camp.name}</div>
                    <StatusPill tone={camp.status === 'active' ? 'teal' : 'neutral'}>{camp.status}</StatusPill>
                  </div>
                  <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 6 }}>
                    {camp.area_mode === 'whole_area' ? camp.area_reference :
                     camp.area_mode === 'multi_block' ? `${camp.area_blocks?.length || 0} blocks selected` :
                     'Single block'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppScreen>
  );
}
