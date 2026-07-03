import Link from 'next/link';
import { supabaseService } from '@/lib/supabase-server';
import AppScreen from '@/components/layout/AppScreen';
import StatusPill from '@/components/layout/StatusPill';
import EmptyState from '@/components/layout/EmptyState';

const RUN_STATUS_TONE: Record<string, 'success' | 'pending' | 'teal' | 'neutral'> = {
  ready: 'success',
  scheduled: 'pending',
  active: 'teal',
  completed: 'neutral',
  cancelled: 'neutral',
};

export default async function CampaignOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = supabaseService();

  const { data: campaign } = await (db.from('campaigns') as any).select('*').eq('id', id).single();
  const { data: runs } = await (db.from('collection_runs') as any)
    .select('*, pledges!pledges_collection_run_id_fkey(id, status, needs_two_crew)')
    .eq('campaign_id', id)
    .order('run_date', { ascending: true });

  if (!campaign) {
    return <AppScreen style={{ padding: 24 }}>Campaign not found</AppScreen>;
  }

  const allPledges = (runs || []).flatMap((r: any) => r.pledges || []);
  const totalPledges = allPledges.length;
  const pendingPledges = allPledges.filter((p: any) => p.status === 'pending').length;
  const blockCount = campaign.area_mode === 'whole_area'
    ? new Set((runs || []).flatMap((r: any) => r.area_blocks || [])).size
    : (campaign.area_blocks?.length || 0);

  const fmtShort = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const areaLabel = campaign.area_mode === 'whole_area' ? campaign.area_reference : `${campaign.area_blocks?.length || 0} blocks`;

  return (
    <AppScreen
      footer={
        <Link href={`/coordinator/run/new?campaignId=${id}`} className="btn-ghost" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          + Add a run
        </Link>
      }
    >
      <div style={{ padding: '14px 22px 16px', background: 'var(--teal)', color: '#fff', borderRadius: '0 0 var(--r-hero) var(--r-hero)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/coordinator" style={{ textDecoration: 'none', font: '800 22px var(--font-ui)', color: 'var(--teal-pale)', lineHeight: 1 }}>‹</Link>
          <div>
            <div style={{ font: '700 18px var(--font-serif)' }}>{campaign.name}</div>
            <div style={{ font: '700 11px var(--font-ui)', color: 'var(--teal-pale)' }}>
              {fmtShort(campaign.starts_at)}–{fmtShort(campaign.ends_at)} · {areaLabel} · {campaign.status}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <div><div style={{ font: '700 22px var(--font-serif)' }}>{totalPledges}</div><div style={{ font: '700 10px var(--font-ui)', color: 'var(--teal-pale)' }}>pledges</div></div>
          <div><div style={{ font: '700 22px var(--font-serif)' }}>{blockCount}</div><div style={{ font: '700 10px var(--font-ui)', color: 'var(--teal-pale)' }}>blocks</div></div>
          <div><div style={{ font: '700 22px var(--font-serif)' }}>{runs?.length || 0}</div><div style={{ font: '700 10px var(--font-ui)', color: 'var(--teal-pale)' }}>runs</div></div>
          <div><div style={{ font: '700 22px var(--font-serif)' }}>{pendingPledges}</div><div style={{ font: '700 10px var(--font-ui)', color: 'var(--teal-pale)' }}>pending</div></div>
        </div>
      </div>

      <div style={{ padding: '24px 22px' }}>
        <h2 className="section-label" style={{ margin: '0 0 16px' }}>Runs in this campaign</h2>

        {runs?.length === 0 ? (
          <EmptyState title="No collection runs scheduled yet" description="Add a run to start collecting from a block." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {runs?.map((run: any) => {
              const dateObj = new Date(run.run_date);
              const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

              const startHour = run.time_window_start ? run.time_window_start.split(':')[0] : '09';
              const endHour = run.time_window_end ? run.time_window_end.split(':')[0] : '12';
              const runPledges = run.pledges || [];
              const bulkyCount = runPledges.filter((p: any) => p.needs_two_crew).length;

              return (
                <div key={run.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ font: '700 18px var(--font-serif)', color: 'var(--text-dark)' }}>
                      {dateStr}
                    </div>
                    <StatusPill tone={RUN_STATUS_TONE[run.status] || 'neutral'}>{run.status}</StatusPill>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)' }}>
                      {startHour}:00–{endHour}:00 · {runPledges.length} pledges
                    </span>
                    {bulkyCount > 0 && (
                      <StatusPill tone="amber">{bulkyCount} bulky</StatusPill>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <Link href={`/coordinator/run/${run.id}/route`} className="btn-ghost" style={{ flex: 1, padding: 10, fontSize: 13, textDecoration: 'none', textAlign: 'center', pointerEvents: run.status === 'completed' ? 'none' : 'auto', opacity: run.status === 'completed' ? 0.5 : 1 }}>
                      Plan Route
                    </Link>
                    {run.status === 'completed' ? (
                      <div style={{ flex: 1, padding: 10, fontSize: 13, textAlign: 'center', background: 'var(--cream-bg)', color: 'var(--text-muted)', borderRadius: 10, font: '800 13px var(--font-ui)' }}>
                        Completed
                      </div>
                    ) : (
                      <Link href={`/coordinator/run/${run.id}/queue`} className="btn-primary" style={{ flex: 1, padding: 10, fontSize: 13, textDecoration: 'none', textAlign: 'center' }}>
                        Start Run
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppScreen>
  );
}
