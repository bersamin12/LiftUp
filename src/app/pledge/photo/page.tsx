'use client';

import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Callout from '@/components/layout/Callout';

export default function PhotoPledgePage() {
  return (
    <Suspense fallback={null}>
      <PhotoPledgeContent />
    </Suspense>
  );
}

function PhotoPledgeContent() {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tags, setTags] = useState<{ category: string, condition: string, sizeBucket: string, needsTwoCrew: boolean } | null>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skipPhoto, setSkipPhoto] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const isInterestMode = !runId;
  const pickupDate = searchParams.get('date');
  const pickupTime = searchParams.get('time');

  // State for the interactive chips
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');

  const categories = ['Clothing', 'Books', 'Toys', 'Electronics', 'Furniture', 'Other'];
  const conditions = ['Like New', 'Well-Used', 'Needs Repair', 'Not Working'];

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoDataUrl(base64);
      setAnalyzing(true);
      setError('');

      try {
        const res = await fetch('/api/pledge/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        
        if (!res.ok) throw new Error('Failed to analyze image');
        
        const data = await res.json();
        setTags(data);
        setSelectedCategory(data.category);
        setSelectedCondition(data.condition);
      } catch (err) {
        setError('Analysis failed, but you can still tag manually.');
        setTags({ category: 'Other', condition: 'Like New', sizeBucket: 'One bag', needsTwoCrew: false });
        setSelectedCategory('Other');
        setSelectedCondition('Like New');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (isInterestMode) {
      const res = await fetch('/api/interest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory || null,
          note: selectedCondition ? `Condition: ${selectedCondition}` : null,
        }),
      });
      if (res.ok) {
        router.push('/pledge/interest?done=1');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(`Failed: ${data.error || 'Server error'}`);
      }
      return;
    }

    // In a real app we'd upload the photo to Supabase Storage and get a real URL
    // For the demo we send the data or leave it null
    const res = await fetch('/api/pledge/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection_run_id: runId,
        ai_suggested_category: tags?.category,
        ai_suggested_condition: tags?.condition,
        ai_suggested_size: tags?.sizeBucket,
        confirmed_category: selectedCategory,
        confirmed_condition: selectedCondition,
        size_bucket: tags?.sizeBucket,
        needs_two_crew: tags?.needsTwoCrew,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/pledge/confirmed?pledgeId=${data.pledge.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(`Failed: ${data.error || 'Server error'}`);
    }
  };

  const showConfirmFooter = (photoDataUrl || skipPhoto) && !analyzing;

  return (
    <AppScreen footer={showConfirmFooter ? <button onClick={handleConfirm} className="btn-primary">Confirm pledge</button> : undefined}>
      <ScreenHeader title="Add your donation" />

      {!photoDataUrl && !skipPhoto ? (
        <div style={{ padding: 22 }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              height: 200, 
              background: 'var(--canvas-bg)', 
              borderRadius: 16, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              border: '2px dashed var(--teal-border)',
              cursor: 'pointer',
              color: 'var(--teal)'
            }}
          >
            <div style={{ font: '800 48px var(--font-ui)' }}>📷</div>
            <div style={{ font: '800 16px var(--font-ui)', marginTop: 12 }}>Tap to snap a photo</div>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleCapture}
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => setSkipPhoto(true)}
            style={{ width: '100%', padding: '16px', background: 'none', border: 'none', font: '800 14px var(--font-ui)', color: 'var(--text-muted)', marginTop: 16, cursor: 'pointer' }}
          >
            Or skip photo and select tags manually
          </button>
        </div>
      ) : (
        <>
          {photoDataUrl && (
            <div style={{ margin: '6px 22px 0', height: 180, borderRadius: 16, position: 'relative', overflow: 'hidden', backgroundImage: `url(${photoDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {analyzing && (
                <>
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: 'linear-gradient(90deg,transparent,#14746f,transparent)', animation: 'scan 1.6s ease-in-out infinite' }}></div>
                  <div style={{ position: 'absolute', left: 10, bottom: 10, background: 'rgba(31,43,39,.88)', color: '#fff', font: '700 11px var(--font-ui)', padding: '6px 11px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', animation: 'bob 0.9s ease-in-out infinite' }}></span>
                    Analysing your photo…
                  </div>
                </>
              )}
            </div>
          )}

          <div className="card" style={{ margin: '12px 22px 0', padding: 14, opacity: analyzing ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            {error && <div style={{ color: 'var(--rust)', font: '700 12px var(--font-ui)', marginBottom: 8 }}>{error}</div>}

            <div style={{ font: '700 14px var(--font-serif)', color: 'var(--text-dark)' }}>We think this is…</div>
            <div style={{ font: '700 11px var(--font-ui)', color: 'var(--rust)', marginBottom: 11 }}>Tap a chip to correct us</div>

            <div className="section-label" style={{ marginBottom: 6 }}>Category</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 13 }}>
              {categories.map(cat => (
                <span
                  key={cat}
                  onClick={() => !analyzing && setSelectedCategory(cat)}
                  className={`chip ${selectedCategory === cat ? 'selected' : ''}`}
                >
                  {cat}
                </span>
              ))}
            </div>

            <div className="section-label" style={{ marginBottom: 6 }}>Condition</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {conditions.map(cond => (
                <span
                  key={cond}
                  onClick={() => !analyzing && setSelectedCondition(cond)}
                  className={`chip ${selectedCondition === cond ? 'selected-amber' : ''}`}
                >
                  {cond}
                </span>
              ))}
            </div>

            {selectedCategory === 'Electronics' && (
              <Callout tone="amber" style={{ marginTop: 10 }}>
                <b>Electronics:</b> photos can&apos;t confirm if it still powers on — please tag condition honestly.
              </Callout>
            )}
          </div>

          {!analyzing && pickupDate && pickupTime && (
            <div className="card" style={{ margin: '12px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: '700 12px var(--font-ui)', color: 'var(--text-mid)', padding: '11px 14px' }}>
              <span>Pickup · {pickupDate}, {pickupTime}</span>
            </div>
          )}
        </>
      )}
    </AppScreen>
  );
}
