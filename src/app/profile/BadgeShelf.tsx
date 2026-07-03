'use client';

import { useState } from 'react';

export default function BadgeShelf({ unlocks, allBadges }: { unlocks: any[], allBadges: any[] }) {
  const [expanded, setExpanded] = useState(false);

  const unlockedBadgeIds = new Set(unlocks.map((u: any) => u.badge_id));
  const lockedBadges = allBadges.filter((b: any) => !unlockedBadgeIds.has(b.id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 2px' }}>
        <span style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.5px' }}>BADGE SHELF</span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', font: '800 11px var(--font-ui)', color: 'var(--teal)', cursor: 'pointer' }}
        >
          {expanded ? 'Show less' : 'See all ›'}
        </button>
      </div>

      {allBadges.length > 0 && (
        <div style={{ padding: '0 22px 10px', font: '700 11px var(--font-ui)', color: 'var(--text-muted)' }}>
          {unlocks.length} of {allBadges.length} collected{unlocks.length < allBadges.length ? ' · keep going!' : ' · full shelf!'}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, padding: '0 22px', overflowX: 'auto', flexWrap: expanded ? 'wrap' : 'nowrap' }}>
        {unlocks.length === 0 && !expanded && (
          <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)' }}>No badges unlocked yet. Start donating!</div>
        )}
        
        {unlocks.map((u: any, idx: number) => (
          <div key={u.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, width: 60 }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', border: `2.5px solid ${u.badges?.accent_color || 'var(--rust)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${idx % 2 === 0 ? '-6deg' : '4deg'})` }}>
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={u.badges?.accent_color || 'var(--rust)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20s-6-4.4-6-9a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 18 11c0 4.6-6 9-6 9z"></path>
              </svg>
            </span>
            <span style={{ font: '800 9px var(--font-ui)', color: 'var(--text-mid)', textAlign: 'center' }}>{u.badges?.name}</span>
          </div>
        ))}

        {expanded && lockedBadges.map((b: any, idx: number) => (
          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, width: 60 }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--locked-bg)', border: `2.5px dashed var(--locked-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${idx % 2 === 0 ? '4deg' : '-6deg'})` }}>
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="var(--locked-icon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20s-6-4.4-6-9a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 18 11c0 4.6-6 9-6 9z"></path>
              </svg>
            </span>
            <span style={{ font: '800 9px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center' }}>{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
