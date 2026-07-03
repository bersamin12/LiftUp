import type { ReactNode } from 'react';
import ShareButton from '@/components/ShareButton';

const DECOR =
  'radial-gradient(circle at 22% 26%, rgba(255,255,255,.10) 0 3px, transparent 3px), ' +
  'radial-gradient(circle at 76% 20%, rgba(217,138,61,.35) 0 5px, transparent 5px), ' +
  'radial-gradient(circle at 84% 62%, rgba(255,255,255,.08) 0 4px, transparent 4px), ' +
  'radial-gradient(circle at 16% 70%, rgba(217,138,61,.3) 0 4px, transparent 4px)';

type BadgeRevealProps = {
  name: string;
  description: string;
  /** The sticker glyph (an SVG or <BadgeIcon />), sized ~76px. */
  icon: ReactNode;
  shareText: string;
  onSkip: () => void;
  onPrimary: () => void;
  primaryLabel?: string;
};

/**
 * The full-screen badge-unlock celebration. Previously duplicated verbatim in
 * pledge/badge/page.tsx and home/RealtimeNotifier.tsx — now a single source of
 * truth. Renders as a full-height teal column (decoration + skip + sticker +
 * copy + footer); the caller provides the surrounding container.
 */
export default function BadgeReveal({
  name,
  description,
  icon,
  shareText,
  onSkip,
  onPrimary,
  primaryLabel = 'Add to my shelf',
}: BadgeRevealProps) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#fff',
        background: 'var(--teal)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: DECOR }} />

      <button
        onClick={onSkip}
        style={{ position: 'absolute', top: 20, right: 20, font: '800 13px var(--font-ui)', color: 'var(--teal-pale)', background: 'rgba(15,86,81,.6)', padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', zIndex: 10 }}
      >
        Skip ✕
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px', position: 'relative', textAlign: 'center', zIndex: 5 }}>
        <div style={{ font: '700 15px var(--font-ui)', color: 'var(--teal-pale)', letterSpacing: '.5px' }}>A NEW STICKER!</div>

        <div
          className="pop-rotate"
          style={{
            width: 150,
            height: 150,
            margin: '22px auto 0',
            borderRadius: '50%',
            background: 'var(--cream-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 12px rgba(255,255,255,.14), 0 18px 40px -14px rgba(0,0,0,.5)',
            transform: 'rotate(-5deg)',
          }}
        >
          {icon}
        </div>

        <div style={{ font: '700 30px var(--font-serif)', marginTop: 26 }}>{name}</div>
        <div style={{ font: '700 15px var(--font-ui)', color: 'var(--teal-pale)', marginTop: 8, lineHeight: 1.45, maxWidth: 250, marginLeft: 'auto', marginRight: 'auto' }}>
          {description}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 5, padding: '0 30px max(40px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <button className="btn-amber" onClick={onPrimary}>
          {primaryLabel}
        </button>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ShareButton
            text={shareText}
            label="Share this moment"
            className=""
            style={{ border: 'none', background: 'transparent', color: 'var(--teal-pale)', font: '800 14px var(--font-ui)', padding: 2, cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
