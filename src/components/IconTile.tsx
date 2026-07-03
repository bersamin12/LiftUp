import type { ReactNode } from 'react';

type IconTileProps = {
  children: ReactNode;
  size?: number;
  /** Background fill (defaults to the pale teal surface). */
  background?: string;
  /** Icon/content colour. */
  color?: string;
  radius?: number;
};

/**
 * Rounded square that holds a small icon or glyph. Unifies the icon-container
 * treatment whose radius previously drifted between 9/12/13/15/50% across
 * home, DonateModal, confirmed and profile.
 */
export default function IconTile({
  children,
  size = 46,
  background = 'var(--teal-light-bg)',
  color = 'var(--teal)',
  radius = 13,
}: IconTileProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      {children}
    </span>
  );
}
