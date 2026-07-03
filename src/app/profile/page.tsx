import Link from 'next/link';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import BadgeShelf from './BadgeShelf';
import PendingDonations from './PendingDonations';
import AppScreen from '@/components/layout/AppScreen';
import EmptyState from '@/components/layout/EmptyState';
import StatusPill from '@/components/layout/StatusPill';
import Avatar from '@/components/Avatar';
import IconTile from '@/components/IconTile';

async function getProfileData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = supabaseService();
  let { data: resident } = await (db.from('residents') as any).select('*').eq('id', user.id).single();
  
  if (!resident) {
    // Auto-create missing profile
    const inviteCode = `USER-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newResident = {
      id: user.id,
      display_name: user.email?.split('@')[0] || 'Resident',
      phone: `GOOGLE-${user.id.substring(0, 8)}`,
      invite_code: inviteCode,
    };
    await (db.from('residents') as any).insert(newResident);
    resident = newResident;
  }
  
  const { data: pledges } = await (db.from('pledges') as any)
    .select('*, collection_runs!pledges_collection_run_id_fkey(run_date, campaigns(name))')
    .eq('resident_id', user.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });

  const { data: unlocks } = await (db.from('badge_unlocks') as any)
    .select('*, badges(*)')
    .eq('resident_id', user.id);

  const { data: allBadges } = await (db.from('badges') as any).select('*');

  const { data: openInterests } = await (db.from('donation_interests') as any)
    .select('*')
    .eq('resident_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (!resident.block_id) {
    const { redirect } = await import('next/navigation');
    redirect('/setup');
  }

  // Ensure unit_ref is generated for leaderboard participation
  if (!resident.unit_ref) {
    const floor = Math.floor(Math.random() * 12) + 1;
    const unit = Math.floor(Math.random() * 100) + 10;
    resident.unit_ref = `#${String(floor).padStart(2, '0')}-${unit}`;
    await (db.from('residents') as any).update({ unit_ref: resident.unit_ref }).eq('id', user.id);
  }

  // Fetch block impact stats
  let block = null;
  let blockPledgesCount = 0;
  
  if (resident.block_id) {
    const { data: b } = await (db.from('blocks') as any).select('*').eq('block_id', resident.block_id).single();
    block = b;
    const { data: blockPledges } = await (db.from('pledges') as any)
      .select('id, residents!inner(block_id)')
      .eq('status', 'confirmed')
      .eq('residents.block_id', resident.block_id);
    blockPledgesCount = blockPledges?.length || 0;
  }

  return {
    resident,
    pledges: pledges || [],
    unlocks: unlocks || [],
    allBadges: allBadges || [],
    openInterests: openInterests || [],
    block,
    blockPledgesCount
  };
}

export default async function ProfilePage() {
  const data = await getProfileData();

  if (!data) {
    return <div style={{ padding: 24 }}>Please log in as a resident to view your profile.</div>;
  }

  const { resident, pledges, unlocks, allBadges, openInterests, block, blockPledgesCount } = data;
  
  const uniqueCampaigns = new Set(pledges.map((p: any) => p.collection_runs?.campaigns?.name)).size;

  return (
    <AppScreen nav="resident">
      <div style={{ paddingBottom: 24 }}>
        <div style={{ padding: '16px 22px 12px', display: 'flex', alignItems: 'center', gap: 13, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <Avatar name={resident.display_name} size={54} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ font: '700 21px var(--font-serif)', color: 'var(--text-dark)' }}>{resident.display_name}</div>
              <div style={{ font: '800 13px var(--font-ui)', color: 'var(--rust)' }}>{resident.badge_level} · {resident.total_points} points</div>
            </div>
          </div>
          <Link href="/home" style={{ font: '800 24px var(--font-ui)', color: 'var(--teal)', textDecoration: 'none' }}>×</Link>
        </div>

        <div className="card" style={{ margin: '0 22px', padding: '13px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: '700 20px var(--font-serif)', color: 'var(--teal)' }}>{pledges.length}</div>
            <div style={{ font: '700 10px var(--font-ui)', color: 'var(--text-muted)' }}>items</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: '700 20px var(--font-serif)', color: 'var(--teal)' }}>{uniqueCampaigns}</div>
            <div style={{ font: '700 10px var(--font-ui)', color: 'var(--text-muted)' }}>campaigns</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: '700 20px var(--font-serif)', color: 'var(--teal)' }}>{unlocks.length}</div>
            <div style={{ font: '700 10px var(--font-ui)', color: 'var(--text-muted)' }}>badges</div>
          </div>
        </div>

        <BadgeShelf unlocks={unlocks} allBadges={allBadges} />

        <PendingDonations interests={openInterests} />

        <div className="section-label" style={{ padding: '24px 22px 8px' }}>Donation history</div>
        <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {pledges.length === 0 ? (
            <EmptyState title="No confirmed pledges yet" description="Your donation history will show up here once a collector picks up your first item." />
          ) : (
            pledges.map((p: any) => {
              const runDate = p.collection_runs?.run_date ? new Date(p.collection_runs.run_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Unknown Date';
              return (
                <div key={p.id} className="card" style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <IconTile size={34} radius={10}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                  </IconTile>
                  <div style={{ flex: 1, lineHeight: 1.2 }}>
                    <div style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)' }}>{p.confirmed_category || p.ai_suggested_category} · {p.size_bucket}</div>
                    <div style={{ font: '700 11px var(--font-ui)', color: 'var(--text-muted)' }}>{p.collection_runs?.campaigns?.name} · {runDate}</div>
                  </div>
                  <StatusPill tone="success">Collected</StatusPill>
                </div>
              );
            })
          )}
        </div>

        <div className="section-label" style={{ padding: '24px 22px 8px' }}>Share your impact</div>
        <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
          <div className="card--interactive" style={{ margin: '0 22px', borderRadius: 'var(--r-hero)', overflow: 'hidden', background: 'var(--teal)', color: '#fff', padding: 18, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--teal-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)' }}></span>
              </span>
              <span style={{ font: '800 13px var(--font-ui)' }}>LiftUp</span>
            </div>
            <div style={{ font: '700 21px var(--font-serif)', marginTop: 12, lineHeight: 1.15 }}>I gave {blockPledgesCount} items<br/>with my block</div>
            <div style={{ font: '700 12px var(--font-ui)', color: 'var(--teal-pale)', marginTop: 6 }}>
              {block ? `Blk ${block.block_number} ${block.street_name}` : 'No block assigned'} · {blockPledgesCount} total block items
            </div>
            <div style={{ position: 'absolute', right: 14, bottom: 12, font: '800 10px var(--font-ui)', letterSpacing: '.4px', color: 'var(--teal-pale)' }}>
              TAP FOR LEADERBOARD ›
            </div>
          </div>
        </Link>
      </div>
      {/* Settings / Actions */}
      <div style={{ padding: '0 22px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link href="/refer" className="card card--interactive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconTile size={32} radius={16}><span style={{ fontSize: 16 }}>👋</span></IconTile>
            <span style={{ font: '800 15px var(--font-ui)', color: 'var(--text-dark)' }}>Refer a neighbour</span>
          </div>
          <span style={{ color: 'var(--teal)', font: '800 18px var(--font-ui)' }}>›</span>
        </Link>
      </div>
    </AppScreen>
  );
}
