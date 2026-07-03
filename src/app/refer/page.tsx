import { supabaseService } from '@/lib/supabase-server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Callout from '@/components/layout/Callout';
import StatusPill from '@/components/layout/StatusPill';
import ShareButton from '@/components/ShareButton';

export default async function ReferPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = supabaseService();
  const { data: resident } = await (db.from('residents') as any).select('invite_code').eq('id', user.id).single();

  const { data: referrals } = await (db.from('referrals') as any)
    .select('vested, invitee:residents!referrals_invitee_id_fkey(display_name)')
    .eq('inviter_id', user.id)
    .order('created_at', { ascending: false });

  const inviteCode = resident?.invite_code || '';
  const shareText = `Join me on LiftUp and give from your doorstep! Use my invite code ${inviteCode} when you sign up.`;

  return (
    <AppScreen>
      <ScreenHeader title="Refer a neighbour" backHref="/profile" />

      <div style={{ padding: '4px 22px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))', marginBottom: 24 }}>👋</div>
        <h2 style={{ font: '800 24px var(--font-serif)', color: 'var(--text-dark)', marginBottom: 12 }}>
          Give together, earn together
        </h2>
        <p style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
          Share your invite code with neighbours. When they sign up and complete their first donation, you both earn bonus points!
        </p>

        <div style={{ textAlign: 'left', marginBottom: 24 }}>
          <Callout tone="amber">
            Your friend must <b>actually donate</b> before you both earn <b>+50 points</b>. No donation, no points.
          </Callout>
        </div>

        <div style={{ background: '#fff', border: '2px dashed var(--teal-border)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
          <div className="section-label" style={{ letterSpacing: '1px', marginBottom: 12 }}>Your invite code</div>
          <div style={{ font: '800 32px var(--font-serif)', color: 'var(--teal)', letterSpacing: '2px' }}>
            {inviteCode || '– – – –'}
          </div>
        </div>

        <ShareButton text={shareText} label="Share Code" className="btn-primary" />

        {referrals && referrals.length > 0 && (
          <div style={{ marginTop: 32, textAlign: 'left' }}>
            <div className="section-label" style={{ marginBottom: 9 }}>Your invites</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {referrals.map((ref: any, i: number) => (
                <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px' }}>
                  <span style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)' }}>{ref.invitee?.display_name || 'A neighbour'}</span>
                  <StatusPill tone={ref.vested ? 'success' : 'pending'}>{ref.vested ? 'Donated · +50' : 'Joined · pending'}</StatusPill>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppScreen>
  );
}
