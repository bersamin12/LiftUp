'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppScreen from '@/components/layout/AppScreen';
import ShareButton from '@/components/ShareButton';

export default function BadgeUnlockPage() {
  return (
    <Suspense fallback={null}>
      <BadgeUnlockContent />
    </Suspense>
  );
}

function BadgeUnlockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const badgeName = searchParams.get('name') || 'First Give';
  const badgeDescription = searchParams.get('description')
    || "Your very first donation is on its way to a neighbour. Terima kasih for starting the chain ♥";

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <button onClick={() => router.push('/profile')} style={{ border: 'none', background: 'var(--amber)', color: '#fff', font: '800 16px var(--font-ui)', padding: 16, borderRadius: 15, cursor: 'pointer', boxShadow: '0 8px 18px -8px rgba(0,0,0,.4)' }}>
        Add to my shelf
      </button>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ShareButton
          text={`I just earned the "${badgeName}" badge on LiftUp! ${badgeDescription}`}
          label="Share this moment"
          className=""
          style={{ border: 'none', background: 'transparent', color: '#bfe0da', font: '800 14px var(--font-ui)', padding: 2, cursor: 'pointer' }}
        />
      </div>
    </div>
  );

  return (
    <AppScreen background="#14746f" style={{ color: '#fff', overflow: 'hidden' }} footer={footer}>
      {/* Decorative background radial gradients matching Figma */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 22% 26%, rgba(255,255,255,.10) 0 3px, transparent 3px), radial-gradient(circle at 76% 20%, rgba(217,138,61,.35) 0 5px, transparent 5px), radial-gradient(circle at 84% 62%, rgba(255,255,255,.08) 0 4px, transparent 4px), radial-gradient(circle at 16% 70%, rgba(217,138,61,.3) 0 4px, transparent 4px)' }}></div>

      <button onClick={() => router.push('/profile')} style={{ position: 'absolute', top: 20, right: 20, font: '800 13px var(--font-ui)', color: '#bfe0da', background: 'rgba(15,86,81,.6)', padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', zIndex: 10 }}>
        Skip ✕
      </button>

      <div style={{ padding: '96px 30px 0', position: 'relative', textAlign: 'center', zIndex: 10 }}>
        <div style={{ font: '700 15px var(--font-ui)', color: '#cfe6e1', letterSpacing: '.5px' }}>A NEW STICKER!</div>

        <div className="pop-rotate" style={{ width: 150, height: 150, margin: '22px auto 0', borderRadius: '50%', background: 'var(--cream-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 12px rgba(255,255,255,.14), 0 18px 40px -14px rgba(0,0,0,.5)', transform: 'rotate(-5deg)' }}>
          <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="var(--rust)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20s-6-4.4-6-9a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 18 11c0 4.6-6 9-6 9z"></path>
          </svg>
        </div>

        <div style={{ font: '700 30px var(--font-serif)', marginTop: 26 }}>{badgeName}</div>
        <div style={{ font: '700 15px var(--font-ui)', color: '#cfe6e1', marginTop: 8, lineHeight: 1.45, maxWidth: 230, marginLeft: 'auto', marginRight: 'auto' }}>
          {badgeDescription}
        </div>
      </div>
    </AppScreen>
  );
}
