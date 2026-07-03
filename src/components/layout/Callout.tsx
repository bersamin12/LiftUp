import type { CSSProperties, ReactNode } from 'react';

type CalloutProps = {
  tone?: 'teal' | 'amber';
  /** Overrides the default checkmark/"i" glyph, e.g. a custom SVG. */
  icon?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
};

export default function Callout({ tone = 'teal', icon, children, style }: CalloutProps) {
  const isAmber = tone === 'amber';
  return (
    <div
      style={{
        display: 'flex',
        gap: isAmber ? 8 : 10,
        alignItems: 'flex-start',
        background: isAmber ? 'var(--warn-bg)' : 'var(--teal-light-bg)',
        border: `1px solid ${isAmber ? 'var(--warn-border)' : 'var(--teal-border)'}`,
        borderRadius: isAmber ? 11 : 14,
        padding: isAmber ? '9px 11px' : '12px 14px',
        ...style,
      }}
    >
      <span
        style={{
          width: isAmber ? 16 : icon ? 34 : 20,
          height: isAmber ? 16 : icon ? 34 : 20,
          borderRadius: icon ? 10 : '50%',
          background: isAmber ? 'var(--rust)' : 'var(--teal)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 auto',
          marginTop: isAmber ? 1 : 0,
          font: isAmber ? '900 10px var(--font-ui)' : undefined,
        }}
      >
        {icon ?? (isAmber ? 'i' : <span style={{ width: 6, height: 11, border: 'solid #fff', borderWidth: '0 2px 2px 0', transform: 'rotate(45deg)', marginTop: -2 }} />)}
      </span>
      <div style={{ font: isAmber ? '700 10.5px var(--font-ui)' : '700 12px var(--font-ui)', color: isAmber ? 'var(--warn-text)' : 'var(--teal-dark)', lineHeight: isAmber ? 1.35 : 1.4 }}>
        {children}
      </div>
    </div>
  );
}
