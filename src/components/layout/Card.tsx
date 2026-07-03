import type { CSSProperties, ReactNode } from 'react';

type CardProps = {
  /** Larger radius for hero / feature cards. */
  hero?: boolean;
  /** Adds hover-lift + press feedback (use for clickable cards). */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * The canonical white card surface: token-driven background, border, radius
 * and shadow. Replaces the ~70 hand-rolled inline `background:'#fff'` blocks.
 */
export default function Card({ hero, interactive, className, style, children }: CardProps) {
  const classes = ['card'];
  if (hero) classes.push('card--hero');
  if (interactive) classes.push('card--interactive');
  if (className) classes.push(className);
  return (
    <div className={classes.join(' ')} style={style}>
      {children}
    </div>
  );
}
