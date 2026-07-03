type CategoryBarProps = {
  label: string;
  count: number;
  total: number;
  color?: string;
};

export default function CategoryBar({ label, count, total, color = 'var(--teal)' }: CategoryBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ font: '800 14px var(--font-ui)', color: 'var(--text-dark)' }}>{label}</span>
        <span style={{ font: '800 14px var(--font-serif)', color }}>
          {count} <span style={{ opacity: 0.5, fontSize: 12 }}>({percentage}%)</span>
        </span>
      </div>
      <div className="progress-bar-track" style={{ height: 8 }}>
        <div className="progress-bar-fill" style={{ width: `${percentage}%`, background: color }}></div>
      </div>
    </div>
  );
}
