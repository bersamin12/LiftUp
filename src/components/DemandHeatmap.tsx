'use client';

import dynamic from 'next/dynamic';

const InterestMap = dynamic(() => import('@/components/InterestMap'), { ssr: false });

type InterestBlock = {
  block_id: string;
  block_number: string;
  street_name: string;
  lat: number | null;
  lng: number | null;
  interestCount: number;
  categoryBreakdown?: Record<string, number>;
};

export default function DemandHeatmap({ blocks }: { blocks: InterestBlock[] }) {
  const totalInterested = blocks.reduce((sum, b) => sum + b.interestCount, 0);

  if (blocks.length === 0) {
    return (
      <div style={{ padding: '20px 16px', textAlign: 'center', font: '700 13px var(--font-ui)', color: 'var(--text-muted)', background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16 }}>
        No donor interest registered yet.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 14, boxShadow: 'var(--shadow-card)' }}>
      <InterestMap blocks={blocks} selectedBlockIds={[]} readOnly />
      <div style={{ font: '700 12px var(--font-ui)', color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
        {totalInterested} {totalInterested === 1 ? 'resident has' : 'residents have'} registered interest across {blocks.length} block{blocks.length === 1 ? '' : 's'}
      </div>
    </div>
  );
}
