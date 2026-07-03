'use client';

import { useState } from 'react';
import StatusPill from '@/components/layout/StatusPill';

type Interest = {
  id: string;
  category: string | null;
  note: string | null;
};

export default function PendingDonations({ interests }: { interests: Interest[] }) {
  const [items, setItems] = useState(interests);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const handleWithdraw = async (id: string) => {
    setWithdrawingId(id);
    try {
      const res = await fetch('/api/interest/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <>
      <div style={{ padding: '24px 22px 8px', font: '800 12px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.5px' }}>PENDING DONATIONS</div>
      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map(interest => (
          <div key={interest.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 13, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--warn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '18px var(--font-ui)' }}>📦</span>
            <div style={{ flex: 1, lineHeight: 1.2 }}>
              <div style={{ font: '800 13px var(--font-ui)', color: 'var(--text-dark)' }}>{interest.category || 'Item'}{interest.note ? ` · ${interest.note}` : ''}</div>
              <div style={{ font: '700 11px var(--font-ui)', color: 'var(--text-muted)' }}>Waiting for a pickup near you</div>
            </div>
            <StatusPill tone="pending">Pending</StatusPill>
            <button
              onClick={() => handleWithdraw(interest.id)}
              disabled={withdrawingId === interest.id}
              style={{ background: 'none', border: 'none', font: '800 11px var(--font-ui)', color: 'var(--rust)', cursor: 'pointer', padding: 0, opacity: withdrawingId === interest.id ? 0.5 : 1 }}
            >
              {withdrawingId === interest.id ? '...' : 'Withdraw'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
