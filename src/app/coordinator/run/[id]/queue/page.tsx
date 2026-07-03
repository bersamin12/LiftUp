'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { processPledge, getRunPledges } from '@/app/coordinator/actions';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import StatusPill from '@/components/layout/StatusPill';
import EmptyState from '@/components/layout/EmptyState';

function floorOf(unitRef: string | undefined | null): string {
  const match = unitRef?.match(/^#(\d+)-/);
  return match ? match[1] : 'Unknown';
}

export default function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: runId } = use(params);
  
  const [pledges, setPledges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPledges() {
      try {
        const data = await getRunPledges(runId);
        setPledges(data);
      } catch (err) {
        console.error('Failed to fetch pledges', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPledges();
  }, [runId]);

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');

  const declineReasons = ['Poor quality', 'Broken / unusable', 'Too heavy', 'Other'];

  const handleAction = async (id: string, action: 'pickup' | 'decline' | 'postpone', reason?: string) => {
    try {
      await processPledge(id, action, reason);
      setPledges(prev => prev.map(p => p.id === id ? { ...p, status: action === 'pickup' ? 'confirmed' : action === 'decline' ? 'declined' : 'postponed' } : p));
      setDecliningId(null);
      setSelectedReason('');
    } catch (err) {
      console.error(err);
    }
  };

  const visiblePledges = pledges.filter(p => activeTab === 'pending' ? p.status === 'pending' : p.status !== 'pending');

  // Group by block, then by floor within each block
  const grouped = visiblePledges.reduce((acc, pledge) => {
    const blockLabel = pledge.residents?.blocks
      ? `Blk ${pledge.residents.blocks.block_number} ${pledge.residents.blocks.street_name}`
      : 'Unknown Block';

    if (!acc[blockLabel]) acc[blockLabel] = {};
    const floor = floorOf(pledge.residents?.unit_ref);
    if (!acc[blockLabel][floor]) acc[blockLabel][floor] = [];
    acc[blockLabel][floor].push(pledge);
    return acc;
  }, {} as Record<string, Record<string, any[]>>);

  if (loading) return <AppScreen style={{ padding: 24, textAlign: 'center' }}>Loading...</AppScreen>;

  const footer = (
    <button
      onClick={async () => {
        const { finishRun } = await import('@/app/coordinator/actions');
        try {
          const res = await finishRun(runId);
          if (res.success) {
            router.push('/coordinator');
          }
        } catch (err: any) {
          console.error(err);
          alert('Failed to finish run: ' + (err.message || String(err)));
        }
      }}
      className="btn-primary"
    >
      Finish Run & Campaign
    </button>
  );

  return (
    <AppScreen footer={footer}>
      <ScreenHeader title="Active Run" />

      <div style={{ padding: '0 22px', display: 'flex', gap: 16, borderBottom: '1px solid var(--card-border)' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'pending' ? '3px solid var(--teal)' : '3px solid transparent', padding: '12px 0', font: '800 14px var(--font-ui)', color: activeTab === 'pending' ? 'var(--teal)' : 'var(--text-muted)' }}
        >
          Queue
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'completed' ? '3px solid var(--teal)' : '3px solid transparent', padding: '12px 0', font: '800 14px var(--font-ui)', color: activeTab === 'completed' ? 'var(--teal)' : 'var(--text-muted)' }}
        >
          Completed
        </button>
      </div>

      <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(grouped).length === 0 ? (
          <EmptyState title="No pledges found" description="Nothing to show in this tab yet." />
        ) : (
          Object.entries(grouped).map(([block, floors]) => (
            <div key={block}>
              <div style={{ font: '800 14px var(--font-ui)', color: 'var(--text-dark)', marginBottom: 12 }}>{block}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {Object.entries(floors as Record<string, any[]>)
                  .sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
                  .map(([floor, items]) => (
                  <div key={floor}>
                    <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.4px', marginBottom: 10 }}>
                      {floor === 'Unknown' ? 'UNKNOWN FLOOR' : `FLOOR ${floor} · ${items.length} UNIT${items.length === 1 ? '' : 'S'}`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {items.map((pledge: any) => (
                        <div key={pledge.id} className="card" style={{ padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ font: '800 16px var(--font-ui)', color: 'var(--text-dark)' }}>
                              {pledge.residents?.unit_ref || 'Unknown Unit'}
                            </div>
                            {pledge.status !== 'pending' && (
                              <StatusPill>{pledge.status}</StatusPill>
                            )}
                          </div>
                          {pledge.needs_two_crew && (
                            <div style={{ marginTop: 6 }}>
                              <StatusPill tone="amber">Needs 2 people</StatusPill>
                            </div>
                          )}
                          <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 2 }}>
                      {pledge.confirmed_category || pledge.ai_suggested_category} · {pledge.size_bucket}
                    </div>
                    
                    {activeTab === 'pending' && decliningId !== pledge.id && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button onClick={() => handleAction(pledge.id, 'pickup')} className="btn-primary" style={{ flex: 1.3, padding: '14px 0', fontSize: 14 }}>Picked up</button>
                        <button onClick={() => setDecliningId(pledge.id)} style={{ flex: 1, border: '1.5px solid var(--card-border)', background: '#fff', color: 'var(--rust)', font: '800 13px var(--font-ui)', padding: '14px 0', borderRadius: 'var(--r-btn)', cursor: 'pointer' }}>Decline</button>
                        <button onClick={() => handleAction(pledge.id, 'postpone')} style={{ flex: 1, border: '1.5px solid var(--warn-border)', background: '#fff', color: 'var(--amber)', font: '800 13px var(--font-ui)', padding: '14px 0', borderRadius: 'var(--r-btn)', cursor: 'pointer' }}>Postpone</button>
                      </div>
                    )}

                    {decliningId === pledge.id && (
                      <div style={{ marginTop: 16, background: '#fff', borderTop: '1px solid var(--card-border)', paddingTop: 16 }}>
                        <div style={{ font: '800 10px var(--font-ui)', color: 'var(--rust)', marginBottom: 7 }}>DECLINE — PICK A REASON</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          {declineReasons.map(reason => (
                            <span
                              key={reason}
                              onClick={() => setSelectedReason(reason)}
                              className={`chip ${selectedReason === reason ? 'selected-rust' : ''}`}
                              style={selectedReason === reason ? undefined : { color: 'var(--rust)', borderColor: 'var(--rust)' }}
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                        <div style={{ font: '700 11px var(--font-ui)', color: 'var(--text-muted)', lineHeight: 1.35, background: 'var(--cream-bg)', borderRadius: 9, padding: '8px 10px', marginBottom: 12 }}>
                          Resident is told why · no points awarded for declined items.
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setDecliningId(null)} style={{ flex: 1, border: 'none', background: 'var(--cream-bg)', color: 'var(--text-muted)', font: '800 13px var(--font-ui)', padding: '14px 0', borderRadius: 'var(--r-btn)', cursor: 'pointer' }}>Cancel</button>
                          <button
                            onClick={() => handleAction(pledge.id, 'decline', selectedReason)}
                            disabled={!selectedReason}
                            className="btn-rust"
                            style={{ flex: 1, padding: '14px 0', fontSize: 13 }}
                          >
                            Confirm Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppScreen>
  );
}
