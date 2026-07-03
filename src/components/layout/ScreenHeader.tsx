'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** If given, back navigates via Link to this href; otherwise calls router.back(). */
  backHref?: string;
  showBack?: boolean;
  variant?: 'plain' | 'hero';
  right?: ReactNode;
};

export default function ScreenHeader({
  title,
  subtitle,
  backHref,
  showBack = true,
  variant = 'plain',
  right,
}: ScreenHeaderProps) {
  const router = useRouter();
  const isHero = variant === 'hero';
  const chevronColor = isHero ? 'var(--teal-pale)' : 'var(--teal)';

  const backButton = showBack && (
    backHref ? (
      <Link href={backHref} style={{ font: '800 24px var(--font-ui)', color: chevronColor, textDecoration: 'none', lineHeight: 1 }}>‹</Link>
    ) : (
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', font: '800 24px var(--font-ui)', color: chevronColor, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
    )
  );

  return (
    <div
      style={{
        padding: isHero ? '16px var(--screen-pad-x) 16px' : '12px var(--screen-pad-x) 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: isHero ? 'var(--teal)' : 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {backButton}
        <div>
          <div style={{ font: isHero ? '800 22px var(--font-ui)' : '700 19px var(--font-serif)', color: isHero ? '#fff' : 'var(--text-dark)' }}>{title}</div>
          {subtitle && (
            <div style={{ font: '700 14px var(--font-ui)', color: isHero ? 'var(--teal-pale)' : 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}
