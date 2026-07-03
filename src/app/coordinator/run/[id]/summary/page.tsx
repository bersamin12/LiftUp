import Link from 'next/link';
import { supabaseService } from '@/lib/supabase-server';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import CategoryBar from '@/components/CategoryBar';
import StatTile from '@/components/layout/StatTile';
import { POINTS_PER_PLEDGE } from '@/lib/constants';

export default async function RunSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseService();

  const { data: run } = await (db.from('collection_runs') as any)
    .select('*, campaigns(name), pledges(*)')
    .eq('id', id)
    .single();

  if (!run) return <AppScreen style={{ padding: 24 }}>Run not found</AppScreen>;

  const pledges = run.pledges || [];
  const confirmed = pledges.filter((p: any) => p.status === 'confirmed');
  const declined = pledges.filter((p: any) => p.status === 'declined');
  const postponed = pledges.filter((p: any) => p.status === 'postponed');

  const categories = confirmed.reduce((acc: any, p: any) => {
    const cat = p.confirmed_category || p.ai_suggested_category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const pointsAwarded = confirmed.length * POINTS_PER_PLEDGE;
  const completionRate = pledges.length > 0 ? Math.round((confirmed.length / pledges.length) * 100) : 0;

  const dateStr = new Date(run.run_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <AppScreen>
      <ScreenHeader title="Run Summary" backHref={`/coordinator/campaign/${run.campaign_id}`} />

      <div style={{ padding: '24px 22px' }}>
        <h1 style={{ font: '700 24px var(--font-serif)', color: 'var(--teal)', margin: 0 }}>Mission Accomplished!</h1>
        <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)', marginTop: 4 }}>
          {run.campaigns?.name} · {dateStr} · {completionRate}% completion rate
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32 }}>
          <StatTile value={confirmed.length} label="Items collected" accent="var(--teal)" size={32} />
          <StatTile value={pointsAwarded} label="Points awarded" accent="var(--rust)" size={32} />
          <StatTile value={postponed.length} label="Postponed" accent="var(--amber)" size={32} />
          <StatTile value={declined.length} label="Declined" accent="var(--text-mid)" size={32} />
        </div>

        <h2 className="section-label" style={{ margin: '32px 0 16px' }}>Collection breakdown</h2>

        <div className="card" style={{ padding: 20 }}>
          {Object.entries(categories).length === 0 ? (
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center' }}>No items collected.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(categories).map(([cat, count]: any) => (
                <CategoryBar key={cat} label={cat} count={count} total={confirmed.length} />
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 40 }}>
          <Link href={`/coordinator/campaign/${run.campaign_id}`} className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Back to Campaign
          </Link>
        </div>
      </div>
    </AppScreen>
  );
}
