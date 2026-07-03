import type { ReactNode } from 'react';

type Tone = 'teal' | 'success' | 'pending' | 'neutral' | 'amber';

const TONE_STYLES: Record<Tone, { background: string; color: string }> = {
  teal:    { background: 'var(--teal-light-bg)', color: 'var(--teal)' },
  success: { background: 'var(--teal-light-bg)', color: 'var(--green-success)' },
  pending: { background: 'var(--pending-bg)', color: 'var(--pending-text)' },
  neutral: { background: 'var(--cream-bg)', color: 'var(--text-mid)' },
  amber:   { background: 'var(--warn-bg)', color: 'var(--amber-dark)' },
};

export default function StatusPill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const { background, color } = TONE_STYLES[tone];
  return (
    <span
      style={{
        background,
        color,
        font: '800 10px var(--font-ui)',
        padding: '4px 10px',
        borderRadius: 999,
        textTransform: 'uppercase',
        letterSpacing: '.3px',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}
