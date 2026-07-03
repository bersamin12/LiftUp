type SuccessCheckProps = {
  size?: number;
  background?: string;
  /** Animate in with the pop-rotate keyframe. */
  animate?: boolean;
};

/**
 * The single success-checkmark treatment used across pledge confirmation /
 * interest / profile. Replaces the mix of 76px/88px border-trick checks and
 * one-off SVG variants with one consistent, scalable mark.
 */
export default function SuccessCheck({ size = 84, background = 'var(--teal)', animate = true }: SuccessCheckProps) {
  return (
    <span
      className={animate ? 'pop-rotate' : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-btn-teal)',
      }}
    >
      <span
        style={{
          width: size * 0.26,
          height: size * 0.48,
          border: 'solid #fff',
          borderWidth: `0 ${Math.max(3, size * 0.055)}px ${Math.max(3, size * 0.055)}px 0`,
          transform: 'rotate(45deg)',
          marginTop: -size * 0.06,
        }}
      />
    </span>
  );
}
