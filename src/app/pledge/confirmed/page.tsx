import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { supabaseService } from '@/lib/supabase-server';
import AppScreen from '@/components/layout/AppScreen';
import ShareButton from '@/components/ShareButton';
import SuccessCheck from '@/components/SuccessCheck';

export default async function PledgeConfirmedPage({ searchParams }: { searchParams: Promise<{ runId?: string; pledgeId?: string }> }) {
  const { runId, pledgeId } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const db = supabaseService();

  let pledge: any = null;
  let resident: any = null;

  if (user) {
    const { data: r } = await (db.from('residents') as any).select('unit_ref, display_name').eq('id', user.id).maybeSingle();
    resident = r;

    if (pledgeId) {
      const { data: p } = await (db.from('pledges') as any)
        .select('*, collection_runs!pledges_collection_run_id_fkey(campaigns(name))')
        .eq('id', pledgeId)
        .eq('resident_id', user.id)
        .maybeSingle();
      pledge = p;
    }

    if (!pledge) {
      let query = (db.from('pledges') as any)
        .select('*, collection_runs!pledges_collection_run_id_fkey(campaigns(name))')
        .eq('resident_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (runId) query = query.eq('collection_run_id', runId);

      const { data: p } = await query.maybeSingle();
      pledge = p;
    }
  }

  const campaignName = pledge?.collection_runs?.campaigns?.name || 'your donation drive';
  const pickupSlot = pledge?.pickup_slot_label || 'TBD';
  const category = pledge?.confirmed_category || pledge?.ai_suggested_category || 'Item';
  const condition = pledge?.confirmed_condition || pledge?.ai_suggested_condition;
  const sizeBucket = pledge?.size_bucket || '1 item';
  const unitRef = resident?.unit_ref;
  const firstName = resident?.display_name?.split(' ')[0];

  const shareText = `I gave ${sizeBucket.toLowerCase()} of ${category.toLowerCase()} to ${campaignName} through LiftUp. Join me!`;

  return (
    <AppScreen
      nav="resident"
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={pledge?.collection_run_id ? `/pledge/photo?runId=${pledge.collection_run_id}` : '/give'} className="btn-ghost" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Add another item
          </Link>
          <ShareButton text={shareText} label="Share to neighbours" />
        </div>
      }
    >
      <div style={{ padding: '44px var(--screen-pad-x) 0', textAlign: 'center' }}>
        <SuccessCheck size={88} />
        <div style={{ font: '700 26px var(--font-serif)', color: 'var(--text-dark)', marginTop: 20 }}>
          {firstName ? `You're all set, ${firstName}` : `You're all set`}
        </div>
        <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)', marginTop: 6 }}>Thank you for lifting up the block</div>
      </div>

      <div className="card" style={{ margin: '26px 22px 0', padding: 20 }}>
        <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: 0.5 }}>YOUR PICKUP · {campaignName.toUpperCase()}</div>
        <div style={{ font: '700 22px var(--font-serif)', color: 'var(--teal)', margin: '6px 0 3px' }}>{pickupSlot}</div>
        <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-mid)' }}>
          A volunteer will knock at {unitRef ? <b style={{ color: 'var(--text-dark)' }}>{unitRef}</b> : 'your door'}
        </div>

        <div style={{ height: 1, background: 'var(--card-border)', margin: '15px 0' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--teal-light-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 12px var(--font-ui)', color: 'var(--teal)', textAlign: 'center' }}>
            {sizeBucket}
          </span>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ font: '800 15px var(--font-ui)', color: 'var(--text-dark)' }}>{category}{condition ? ` · ${condition}` : ''}</div>
            <div style={{ font: '700 12px var(--font-ui)', color: 'var(--text-muted)' }}>Leave it by your door</div>
          </div>
        </div>
      </div>

      <div style={{ margin: '16px 22px 0', textAlign: 'center', font: '700 13px var(--font-ui)', color: 'var(--text-muted)' }}>
        We&apos;ll remind you that morning.
      </div>
    </AppScreen>
  );
}
