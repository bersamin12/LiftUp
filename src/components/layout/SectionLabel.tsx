import type { CSSProperties, ReactNode } from 'react';

type SectionLabelProps = {
  children: ReactNode;
  /** Optional trailing element (e.g. a "+ New" link) rendered on the right. */
  right?: ReactNode;
  style?: CSSProperties;
};

/**
 * The uppercase eyebrow label shown above a group of content. Unifies the
 * `800 12px uppercase muted` pattern that was copy-pasted ~15× inline.
 */
export default function SectionLabel({ children, right, style }: SectionLabelProps) {
  if (right) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }}>
        <span className="section-label">{children}</span>
        {right}
      </div>
    );
  }
  return (
    <div className="section-label" style={style}>
      {children}
    </div>
  );
}
