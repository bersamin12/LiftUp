import type { CSSProperties, ReactNode } from 'react';

type FieldProps = {
  /** Optional label rendered above the control. */
  label?: ReactNode;
  /** Optional error/help text rendered below the control. */
  error?: string;
  hint?: string;
  children: ReactNode;
  style?: CSSProperties;
};

/**
 * Light wrapper for a labelled form control. The control itself should carry
 * the shared `.input` class (which provides the focus ring). Keeps label +
 * input + error spacing consistent across every form.
 */
export default function Field({ label, error, hint, children, style }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, ...style }}>
      {label && (
        <label className="section-label" style={{ letterSpacing: '.4px' }}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ font: '700 12px var(--font-ui)', color: 'var(--rust)' }}>{error}</span>
      ) : hint ? (
        <span style={{ font: '700 12px var(--font-ui)', color: 'var(--text-muted)' }}>{hint}</span>
      ) : null}
    </div>
  );
}
