type WizardProgressProps = {
  step: number;
  total: number;
  label: string;
};

export default function WizardProgress({ step, total, label }: WizardProgressProps) {
  const pct = Math.round((step / total) * 100);
  return (
    <div style={{ padding: '4px var(--screen-pad-x) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase' }}>
          Step {step} of {total}
        </span>
        <span style={{ font: '700 11px var(--font-ui)', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
