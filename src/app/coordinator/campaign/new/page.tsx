'use client';

import { useState, useEffect } from 'react';
import { createCampaign } from '@/app/coordinator/actions';
import { createBrowserClient } from '@supabase/ssr';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import WizardProgress from '@/components/layout/WizardProgress';

const CATEGORY_OPTIONS = ['Clothing', 'Books', 'Toys', 'Electronics', 'Furniture', 'Other'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function NewCampaignPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [areaMode, setAreaMode] = useState<'whole_area' | 'multi_block' | 'single_block'>('whole_area');
  const [categories, setCategories] = useState<string[]>(['Clothing', 'Books', 'Toys']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Only Yishun allowed
  const areaReferences = ['YISHUN'];

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('blocks').select('*').eq('town', 'YISHUN').then(({ data }) => {
      if (data) setBlocks(data);
    });
  }, []);

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set('area_mode', areaMode);
    formData.set('accepted_categories', JSON.stringify(categories));

    if (areaMode === 'multi_block' || areaMode === 'single_block') {
      formData.set('area_blocks', JSON.stringify(selectedBlocks.map(b => b.block_id)));
    }

    try {
      await createCampaign(formData);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const footer = step === 1 ? (
    <button
      type="button"
      onClick={() => name.trim() && setStep(2)}
      className="btn-primary"
      disabled={!name.trim()}
    >
      Continue
    </button>
  ) : (
    <div style={{ display: 'flex', gap: 10 }}>
      <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ flex: '0 0 100px' }}>Back</button>
      <button type="submit" form="new-campaign-form" className="btn-primary" disabled={isSubmitting || categories.length === 0} style={{ flex: 1 }}>
        {isSubmitting ? 'Creating...' : 'Create Campaign'}
      </button>
    </div>
  );

  return (
    <AppScreen background="#fff" footer={footer}>
      <ScreenHeader title="New Campaign" backHref="/coordinator" />
      <WizardProgress step={step} total={2} label={step === 1 ? 'Basics' : 'Area & categories'} />

      <form id="new-campaign-form" onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ display: step === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Campaign name</label>
            <input
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Ramadan Clothing Drive"
              className="input"
            />
          </div>

          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Description (optional)</label>
            <textarea
              name="description"
              rows={3}
              placeholder="What is this campaign collecting, and who benefits?"
              className="input"
              style={{ fontSize: 14, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Starts</label>
              <input
                type="date"
                name="starts_at"
                defaultValue={todayIso()}
                required
                className="input"
                style={{ minWidth: 0, maxWidth: '100%', padding: '14px 10px', fontSize: 14 }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Ends</label>
              <input
                type="date"
                name="ends_at"
                defaultValue={plusDaysIso(30)}
                required
                className="input"
                style={{ minWidth: 0, maxWidth: '100%', padding: '14px 10px', fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: step === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Accepted categories</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORY_OPTIONS.map(cat => (
                <span key={cat} onClick={() => toggleCategory(cat)} className={`chip ${categories.includes(cat) ? 'selected' : ''}`}>
                  {cat}
                </span>
              ))}
            </div>
            {categories.length === 0 && (
              <div style={{ font: '700 11px var(--font-ui)', color: 'var(--rust)', marginTop: 8 }}>Pick at least one category residents can donate.</div>
            )}
          </div>

          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Target area type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setAreaMode('whole_area')}
                className={`chip ${areaMode === 'whole_area' ? 'selected' : ''}`}
              >
                Whole Area
              </button>
              <button
                type="button"
                onClick={() => setAreaMode('multi_block')}
                className={`chip ${areaMode === 'multi_block' ? 'selected' : ''}`}
              >
                Specific Blocks
              </button>
            </div>
          </div>

          {areaMode === 'whole_area' && (
            <div style={{ background: 'var(--cream-bg)', padding: 16, borderRadius: 12 }}>
              <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Select town / GRC</label>
              <select name="area_reference" className="input" style={{ background: '#fff' }}>
                {areaReferences.map(area => (
                  <option key={area} value={area}>{area.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          )}

          {(areaMode === 'multi_block' || areaMode === 'single_block') && (
            <div style={{ background: 'var(--cream-bg)', padding: 16, borderRadius: 12 }}>
              <label className="section-label" style={{ display: 'block', marginBottom: 8 }}>Select blocks</label>
              <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-mid)', marginBottom: 12 }}>
                Search and add HDB blocks below.
              </div>
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
                    {blocks.filter(b => b.block_number.includes(search) || b.street_name.toLowerCase().includes(search.toLowerCase())).slice(0, 10).map(b => (
                      <div
                        key={b.block_id}
                        onClick={() => {
                          if (!selectedBlocks.find(sb => sb.block_id === b.block_id)) {
                            if (areaMode === 'single_block') {
                              setSelectedBlocks([b]);
                            } else {
                              setSelectedBlocks([...selectedBlocks, b]);
                            }
                          }
                          setSearch('');
                        }}
                        style={{ padding: '12px 16px', borderBottom: '1px solid var(--cream-bg)', cursor: 'pointer', font: '700 14px var(--font-ui)' }}
                      >
                        Blk {b.block_number} {b.street_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                {selectedBlocks.map(b => (
                  <span key={b.block_id} onClick={() => setSelectedBlocks(selectedBlocks.filter(sb => sb.block_id !== b.block_id))} className="chip selected" style={{ cursor: 'pointer' }}>
                    Blk {b.block_number} ✕
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </AppScreen>
  );
}
