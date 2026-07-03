import type { ReactNode } from 'react';

type StatTileProps = {
  value: ReactNode;
  label: ReactNode;
  /** Colour for the big number (defaults to teal). */
  accent?: string;
  /** Optional small icon/element shown above the value. */
  icon?: ReactNode;
  /** Big-number font size (defaults to 28). */
  size?: number;
};

/**
 * A white stat card: big serif number + tiny uppercase caption. Replaces the
 * duplicated stat blocks in dashboard / analytics / summary that drifted
 * between 20/28/32px numbers.
 */
export default function StatTile({ value, label, accent = 'var(--teal)', icon, size = 28 }: StatTileProps) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      {icon && <div style={{ marginBottom: 8, color: accent }}>{icon}</div>}
      <div style={{ font: `800 ${size}px var(--font-serif)`, color: accent, lineHeight: 1 }}>{value}</div>
      <div className="section-label" style={{ marginTop: 8 }}>{label}</div>
    </div>
  );
}
