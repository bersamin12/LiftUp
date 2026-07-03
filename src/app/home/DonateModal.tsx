'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DonateModal({ runId, pickupDate, pickupTime, autoOpen }: { runId: string; pickupDate?: string; pickupTime?: string; autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(!!autoOpen);
  const pickupQuery = pickupDate && pickupTime ? `&date=${encodeURIComponent(pickupDate)}&time=${encodeURIComponent(pickupTime)}` : '';

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ border: 'none', width: '100%', background: 'var(--rust)', color: '#fff', font: '800 16px var(--font-ui)', padding: 15, borderRadius: 14, cursor: 'pointer', boxShadow: '0 8px 18px -8px rgba(217,138,61,.7)' }}
      >
        I have something to donate
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setIsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(31,43,39,0.4)', backdropFilter: 'blur(4px)' }}></div>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: 393, background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 22px 48px', animation: 'slideUp 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)' }}>
            <div style={{ width: 40, height: 4, background: 'var(--card-border)', borderRadius: 2, margin: '0 auto 20px' }}></div>
            <h2 style={{ font: '800 20px var(--font-serif)', color: 'var(--text-dark)', margin: '0 0 16px' }}>How would you like to donate?</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href={`/pledge/photo?runId=${runId}${pickupQuery}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--teal-light-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '24px var(--font-ui)' }}>📷</div>
                  <div>
                    <div style={{ font: '800 16px var(--font-ui)', color: 'var(--text-dark)' }}>Snap a photo</div>
                    <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 2 }}>AI will tag it for you</div>
                  </div>
                </div>
              </Link>

              <Link href={`/pledge/voice?runId=${runId}${pickupQuery}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--warn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '24px var(--font-ui)' }}>🎤</div>
                  <div>
                    <div style={{ font: '800 16px var(--font-ui)', color: 'var(--text-dark)' }}>Voice record</div>
                    <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 2 }}>Simple elderly mode</div>
                  </div>
                </div>
              </Link>
            </div>
            
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', width: '100%', padding: '16px 0', marginTop: 12, font: '800 14px var(--font-ui)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
