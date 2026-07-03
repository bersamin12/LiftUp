'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { createRun } from '@/app/coordinator/actions';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import StatusPill from '@/components/layout/StatusPill';

const InterestMap = dynamic(() => import('@/components/InterestMap'), { ssr: false });

export default function NewRunPage() {
  return (
    <Suspense fallback={null}>
      <NewRunContent />
    </Suspense>
  );
}

function NewRunContent() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId') || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  const [interestCategories, setInterestCategories] = useState<Record<string, Record<string, number>>>({});
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.from('campaigns').select('*').eq('id', campaignId).single().then(({ data: camp }) => {
      if (camp) {
        setCampaign(camp);
        supabase.from('blocks').select('*').then(({ data: allBlocks }) => {
          if (allBlocks) {
            let eligible = allBlocks;
            if (camp.area_mode !== 'whole_area' && camp.area_blocks) {
              eligible = allBlocks.filter(b => camp.area_blocks.includes(b.block_id));
            } else if (camp.area_reference) {
              eligible = allBlocks.filter(b => b.town === camp.area_reference);
            }
            setBlocks(eligible);
          }
        });
      }
    });

    fetch('/api/coordinator/interest-counts')
      .then(res => res.ok ? res.json() : { counts: {}, categories: {} })
      .then(data => {
        setInterestCounts(data.counts || {});
        setInterestCategories(data.categories || {});
      })
      .catch(() => {
        setInterestCounts({});
        setInterestCategories({});
      });
  }, [campaignId]);

  const blocksWithInterest = blocks
    .map(b => ({ ...b, interestCount: interestCounts[b.block_id] || 0, categoryBreakdown: interestCategories[b.block_id] }))
    .sort((a, b) => b.interestCount - a.interestCount);

  const interestedBlocks = blocksWithInterest.filter(b => b.interestCount > 0);

  const toggleBlock = (block: any) => {
    setSelectedBlocks(prev =>
      prev.find(sb => sb.block_id === block.block_id)
        ? prev.filter(sb => sb.block_id !== block.block_id)
        : [...prev, block]
    );
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Convert to simple time format HH:MM:SS for the database's time column
    const startTime = formData.get('start_time') as string;
    const endTime = formData.get('end_time') as string;

    formData.set('time_window_start', `${startTime}:00`);
    formData.set('time_window_end', `${endTime}:00`);
    
    formData.set('area_blocks', JSON.stringify(selectedBlocks.map(b => b.block_id)));

    try {
      await createRun(campaignId, formData);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen background="#fff">
      <ScreenHeader title="Schedule Run" />

      <form onSubmit={handleSubmit} style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div>
          <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Run date</label>
          <input
            type="date"
            name="run_date"
            required
            className="input"
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Start time</label>
            <input
              type="time"
              name="start_time"
              defaultValue="09:00"
              required
              className="input"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>End time</label>
            <input
              type="time"
              name="end_time"
              defaultValue="12:00"
              required
              className="input"
            />
          </div>
        </div>

        <div style={{ background: 'var(--cream-bg)', padding: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="section-label">Select blocks to visit</label>
            <button type="button" onClick={() => setShowMap(!showMap)} style={{ background: 'none', border: 'none', font: '800 12px var(--font-ui)', color: 'var(--teal)', cursor: 'pointer', padding: 0 }}>
              {showMap ? 'Hide map' : 'Show map'}
            </button>
          </div>
          <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-mid)', marginBottom: 12 }}>
            Blocks are sorted by donor interest — search and add below, or tap on the map.
          </div>

          {showMap && (
            <div style={{ marginBottom: 14 }}>
              {interestedBlocks.length > 0 ? (
                <InterestMap
                  blocks={interestedBlocks}
                  selectedBlockIds={selectedBlocks.map(b => b.block_id)}
                  onToggle={toggleBlock}
                />
              ) : (
                <div style={{ padding: '20px 16px', textAlign: 'center', font: '700 13px var(--font-ui)', color: 'var(--text-muted)', background: '#fff', borderRadius: 12 }}>
                  No registered interest nearby yet.
                </div>
              )}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search block e.g. 214"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ background: '#fff' }}
            />
            {search && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--card-border)', borderRadius: 12, marginTop: 4, maxHeight: 200, overflowY: 'auto', zIndex: 10 }}>
                {blocksWithInterest.filter(b => b.block_number.includes(search) || b.street_name.toLowerCase().includes(search.toLowerCase())).slice(0, 10).map(b => (
                  <div
                    key={b.block_id}
                    onClick={() => {
                      if (!selectedBlocks.find(sb => sb.block_id === b.block_id)) {
                        setSelectedBlocks([...selectedBlocks, b]);
                      }
                      setSearch('');
                    }}
                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--cream-bg)', cursor: 'pointer', font: '700 14px var(--font-ui)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>Blk {b.block_number} {b.street_name}</span>
                    {b.interestCount > 0 && <StatusPill tone="amber">{b.interestCount} interested</StatusPill>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {selectedBlocks.map(b => (
              <span
                key={b.block_id}
                onClick={() => setSelectedBlocks(selectedBlocks.filter(sb => sb.block_id !== b.block_id))}
                className="chip selected"
                style={{ cursor: 'pointer' }}
              >
                Blk {b.block_number} ✕
              </span>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: 12 }}>
          {isSubmitting ? 'Scheduling...' : 'Schedule Run'}
        </button>
      </form>
    </AppScreen>
  );
}
