import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card fade-in" style={{ padding: 28, textAlign: 'center' }}>
      {icon && <div style={{ font: '800 40px var(--font-ui)', marginBottom: 8 }}>{icon}</div>}
      <div style={{ font: '800 16px var(--font-ui)', color: 'var(--text-dark)' }}>{title}</div>
      {description && <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 4 }}>{description}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
