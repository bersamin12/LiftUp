'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Callout from '@/components/layout/Callout';
import SuccessCheck from '@/components/SuccessCheck';

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
          <SuccessCheck size={76} />
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
        <button onClick={handleSubmit} disabled={submitting || !canSubmit} className="btn-primary">
          {submitting ? 'Submitting...' : 'Register interest'}
        </button>
      }
    >
      <ScreenHeader title="Register your interest" backHref="/home" />

      <div style={{ padding: '4px 22px 0' }}>
        <Callout tone="teal">
          No pickup is scheduled for your block yet. Let us know you&apos;re ready to give, and charities use this to decide where to run their next drive.
        </Callout>
      </div>

      <div style={{ padding: '18px 22px 0' }}>
        <div className="section-label" style={{ marginBottom: 8 }}>Or describe it with photo / voice</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/pledge/photo" style={{ flex: 1, textDecoration: 'none' }}>
            <div className="card card--interactive" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ font: '24px var(--font-ui)' }}>📷</div>
              <div style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)', marginTop: 4 }}>Snap a photo</div>
            </div>
          </Link>
          <Link href="/pledge/voice" style={{ flex: 1, textDecoration: 'none' }}>
            <div className="card card--interactive" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ font: '24px var(--font-ui)' }}>🎤</div>
              <div style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)', marginTop: 4 }}>Voice record</div>
            </div>
          </Link>
        </div>
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        {error && <div style={{ color: 'var(--rust)', font: '700 12px var(--font-ui)', marginBottom: 12 }}>{error}</div>}

        <div className="section-label" style={{ marginBottom: 8 }}>Or just tell us quickly</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <span key={cat} onClick={() => setCategory(category === cat ? '' : cat)} className={`chip ${category === cat ? 'selected' : ''}`}>
              {cat}
            </span>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. 2 bags of clothes, a working microwave"
          rows={3}
          className="input"
          style={{ resize: 'none' }}
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
