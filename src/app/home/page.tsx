import { cookies } from 'next/headers';
import Link from 'next/link';
import RealtimeNotifier from './RealtimeNotifier';
import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import DonateModal from './DonateModal';
import AllocateInterestCard from './AllocateInterestCard';
import AppScreen from '@/components/layout/AppScreen';
import EmptyState from '@/components/layout/EmptyState';
import StatusPill from '@/components/layout/StatusPill';
import Avatar from '@/components/Avatar';

export default async function Home({ searchParams }: { searchParams: Promise<{ give?: string }> }) {
  const { give } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = supabaseService();

  // Fetch resident and block
  let { data: resident } = await (db.from('residents') as any).select('*').eq('id', user.id).single();
  if (!resident) {
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

  let block = null;
  if (resident.block_id) {
    const { data: b } = await (db.from('blocks') as any).select('*').eq('block_id', resident.block_id).single();
    block = b;
  } else {
    // Missing block_id for E1 setup
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

  // Fetch active runs joined with campaigns and orgs
  const { data: runs } = await (db.from('collection_runs') as any)
    .select(`
      *,
      campaigns!inner(
        name,
        organizations!inner(name)
      )
    `)
    .eq('status', 'scheduled')
    .contains('area_blocks', [resident.block_id])
    .order('run_date', { ascending: true })
    .limit(5);

  const displayRuns = runs || [];

  const { data: openInterest } = await (db.from('donation_interests') as any)
    .select('id, category, note')
    .eq('resident_id', user.id)
    .eq('status', 'open')
    .maybeSingle();

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hr12 = hour % 12 || 12;
    return `${hr12}${m === '00' ? '' : ':' + m}${ampm}`;
  };

  const sgHour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Singapore' }).format(new Date()));
  const greeting = sgHour < 12 ? 'Good morning' : sgHour < 18 ? 'Good afternoon' : 'Good evening';

  const nearestRun = displayRuns[0];
  const nearestRunDate = nearestRun ? new Date(nearestRun.run_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const nearestRunTime = nearestRun ? `${formatTime(nearestRun.time_window_start)}–${formatTime(nearestRun.time_window_end)}` : '';

  return (
    <AppScreen nav="resident">
      {user.id && <RealtimeNotifier residentId={user.id} />}

      <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)' }}>
            {block ? `Blk ${block.block_number} · ${block.street_name}` : 'No Block Assigned'}
          </div>
          <div style={{ font: '700 22px var(--font-serif)', color: 'var(--teal)' }}>
            {greeting}, {resident.display_name}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <form action={async () => {
            'use server';
            const { cookies } = await import('next/headers');
            const { createServerClient } = await import('@supabase/ssr');
            const cookieStore = await cookies();
            const supabase = createServerClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
            );
            await supabase.auth.signOut();
            const { redirect } = await import('next/navigation');
            redirect('/login');
          }}>
            <button type="submit" style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: 999, padding: '6px 12px', font: '700 12px var(--font-ui)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Log out
            </button>
          </form>
          <Avatar name={resident.display_name || 'Resident'} size={40} />
        </div>
      </div>

      <div className="section-label" style={{ padding: '2px 22px 0' }}>
        Campaigns near you
      </div>

      <div style={{ padding: '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {displayRuns.length === 0 ? (
          openInterest ? (
            <EmptyState
              icon="📦"
              title="You're on the list"
              description="We've let charities know your block is ready to give. You'll be notified as soon as a pickup is scheduled."
              action={<StatusPill tone="pending">Waiting for a pickup</StatusPill>}
            />
          ) : (
            <EmptyState
              icon="📦"
              title="No campaigns nearby yet"
              description="We'll let you know as soon as a drive is scheduled for your block."
              action={
                <Link href="/pledge/interest" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Register your interest
                </Link>
              }
            />
          )
        ) : (
          <>
            {openInterest && (
              <AllocateInterestCard interest={openInterest} runId={nearestRun.id} pickupDate={nearestRunDate} pickupTime={nearestRunTime} />
            )}
            {displayRuns.map((run: any, i: number) => {
            const orgName = run.campaigns?.organizations?.name || 'Local Charity';
            const campaignName = run.campaigns?.name || 'Community Drive';

            const dateObj = new Date(run.run_date);
            const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = `${formatTime(run.time_window_start)}–${formatTime(run.time_window_end)}`;

            return (
              <div key={run.id} className="card fade-in" style={{ animationDelay: `${i * 60}ms`, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--teal-light-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 13px var(--font-ui)', color: 'var(--teal)' }}>
                    {orgName.substring(0, 2).toUpperCase()}
                  </span>
                  <div style={{ lineHeight: 1.15 }}>
                    <div style={{ font: '700 17px var(--font-serif)', color: 'var(--text-dark)' }}>{campaignName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      <span style={{ font: '700 12px var(--font-ui)', color: 'var(--text-muted)' }}>{orgName}</span>
                      <span className="verified-badge" aria-hidden="true" />
                      <span style={{ font: '800 10px var(--font-ui)', color: 'var(--teal)' }}>Verified</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--cream-bg)', borderRadius: 12, padding: '11px 13px', marginBottom: 13 }}>
                  <div style={{ font: '800 11px var(--font-ui)', color: 'var(--rust)', letterSpacing: '.4px' }}>NEXT RUN · YOUR BLOCK</div>
                  <div style={{ font: '800 14px var(--font-ui)', color: 'var(--text-dark)', marginTop: 3 }}>
                    {dateStr} · {block ? `Blk ${block.block_number}` : 'No Block'} · {timeStr}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ font: '800 10px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.4px', textTransform: 'uppercase' }}>Accepting</span>
                  <span className="chip">Clothing</span>
                  <span className="chip">Books</span>
                  <span className="chip">Toys</span>
                </div>

                <DonateModal runId={run.id} pickupDate={dateStr} pickupTime={timeStr} autoOpen={give === run.id} />
              </div>
            );
          })}
          </>
        )}
      </div>
    </AppScreen>
  );
}
