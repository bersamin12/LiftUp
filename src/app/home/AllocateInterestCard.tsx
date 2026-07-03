'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Interest = {
  id: string;
  category: string | null;
  note: string | null;
};

export default function AllocateInterestCard({ interest, runId, pickupDate, pickupTime }: { interest: Interest; runId: string; pickupDate: string; pickupTime: string }) {
  const router = useRouter();
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState('');

  const handleAllocate = async () => {
    setAllocating(true);
    setError('');
    try {
      const res = await fetch('/api/interest/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId: interest.id, runId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setAllocating(false);
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ font: '800 11px var(--font-ui)', color: 'var(--teal)', letterSpacing: '.4px', marginBottom: 4 }}>YOU ALREADY REGISTERED INTEREST</div>
      <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-dark)', marginBottom: 10 }}>
        {interest.category || 'Item'}{interest.note ? ` · ${interest.note}` : ''}
      </div>
      {error && <div style={{ color: 'var(--rust)', font: '700 12px var(--font-ui)', marginBottom: 10 }}>{error}</div>}
      <button
        onClick={handleAllocate}
        disabled={allocating}
        className="btn-primary"
      >
        {allocating ? 'Adding...' : `Add to pickup · ${pickupDate}, ${pickupTime}`}
      </button>
    </div>
  );
}
