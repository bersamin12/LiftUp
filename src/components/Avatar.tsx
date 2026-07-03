type AvatarProps = {
  /** Full name or label; initials are derived from the first two words. */
  name: string;
  size?: number;
  background?: string;
  color?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Teal initials circle used for residents / orgs (home 40px, profile 54px). */
export default function Avatar({ name, size = 40, background = 'var(--teal)', color = '#fff' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
        font: `800 ${Math.round(size * 0.36)}px var(--font-ui)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
