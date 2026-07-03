import type { CSSProperties, ReactNode } from 'react';
import ResidentBottomNav from '@/components/nav/ResidentBottomNav';
import CoordinatorBottomNav from '@/components/nav/CoordinatorBottomNav';

const NAV_HEIGHT = 68;

type AppScreenProps = {
  children: ReactNode;
  /** Renders the shared bottom nav for that role and reserves space for it. */
  nav?: 'resident' | 'coordinator';
  /** Sticky action area pinned above the nav (or the viewport bottom if no nav). */
  footer?: ReactNode;
  background?: string;
  style?: CSSProperties;
  className?: string;
};

/**
 * Single source of truth for the mobile-first "phone-screen" wrapper.
 * Deliberately does not render the mockup's fake status bar ("9:41" + signal
 * glyph) - that was a design-canvas device-frame artifact, not real UI.
 */
export default function AppScreen({
  children,
  nav,
  footer,
  background = 'var(--cream-bg)',
  style,
  className = '',
}: AppScreenProps) {
  return (
    <div className={`phone-screen ${className}`.trim()} style={{ background, minHeight: '100dvh', ...style }}>
      <div style={{ paddingBottom: nav && !footer ? NAV_HEIGHT + 16 : 0 }}>
        {children}
      </div>

      {footer && (
        <div
          style={{
            position: 'sticky',
            bottom: nav ? NAV_HEIGHT : 0,
            padding: `16px var(--screen-pad-x)`,
            paddingBottom: nav ? 16 : 'max(16px, env(safe-area-inset-bottom))',
            background,
            borderTop: '1px solid var(--card-border)',
          }}
        >
          {footer}
        </div>
      )}

      {nav === 'resident' && <ResidentBottomNav />}
      {nav === 'coordinator' && <CoordinatorBottomNav />}
    </div>
  );
}
