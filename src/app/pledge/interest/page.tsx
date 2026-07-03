'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Callout from '@/components/layout/Callout';

const CATEGORIES = ['Clothing', 'Books', 'Toys', 'Electronics', 'Furniture', 'Household', 'Other'];

export default function RegisterInterestPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInterestContent />
    </Suspense>
  );
}

function RegisterInterestContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(searchParams.get('done') === '1');
  const [error, setError] = useState('');

  const canSubmit = !!category || note.trim().length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/interest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category || null, note: note || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AppScreen nav="resident">
        <ScreenHeader title="Register your interest" backHref="/home" />
        <div style={{ padding: '40px 22px 0', textAlign: 'center' }}>
          <div className="pop-rotate" style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--teal)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 18, height: 34, border: 'solid #fff', borderWidth: '0 6px 6px 0', transform: 'rotate(45deg)', marginTop: -6 }}></span>
          </div>
          <div style={{ font: '700 22px var(--font-serif)', color: 'var(--text-dark)', marginTop: 18 }}>You&apos;re on the list</div>
          <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)', marginTop: 6 }}>
            We&apos;ll let charities know your block is ready to give. You&apos;ll be notified as soon as a pickup is scheduled.
          </div>
          <Link href="/home" className="btn-primary" style={{ display: 'block', marginTop: 28, textAlign: 'center', textDecoration: 'none' }}>
            Back to home
          </Link>
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      nav="resident"
      footer={
        <button onClick={handleSubmit} disabled={submitting || !canSubmit} className="btn-primary" style={{ width: '100%', opacity: submitting || !canSubmit ? 0.5 : 1 }}>
          {submitting ? 'Submitting...' : 'Register interest'}
        </button>
      }
    >
      <ScreenHeader title="Register your interest" backHref="/home" />

      <div style={{ padding: '4px 22px 0' }}>
        <Callout tone="teal">
          No pickup is scheduled for your block yet. Let us know you&apos;re ready to give — charities use this to decide where to run their next drive.
        </Callout>
      </div>

      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 8 }}>OR DESCRIBE IT WITH PHOTO / VOICE</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/pledge/photo" style={{ flex: 1, textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 14, padding: 14, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ font: '24px var(--font-ui)' }}>📷</div>
              <div style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)', marginTop: 4 }}>Snap a photo</div>
            </div>
          </Link>
          <Link href="/pledge/voice" style={{ flex: 1, textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 14, padding: 14, textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ font: '24px var(--font-ui)' }}>🎤</div>
              <div style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)', marginTop: 4 }}>Voice record</div>
            </div>
          </Link>
        </div>
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        {error && <div style={{ color: 'var(--rust)', font: '700 12px var(--font-ui)', marginBottom: 12 }}>{error}</div>}

        <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 8 }}>OR JUST TELL US QUICKLY</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <span key={cat} onClick={() => setCategory(category === cat ? '' : cat)} className={`chip ${category === cat ? 'selected' : ''}`}>
              {cat} {category === cat && '✓'}
            </span>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. 2 bags of clothes, a working microwave"
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--input-border)', font: '700 14px var(--font-ui)', background: '#fff', outline: 'none', resize: 'none' }}
        />
        {!canSubmit && (
          <div style={{ font: '700 11px var(--font-ui)', color: 'var(--text-muted)', marginTop: 8 }}>
            Pick a category or add a note so charities know what you have.
          </div>
        )}
      </div>
    </AppScreen>
  );
}
