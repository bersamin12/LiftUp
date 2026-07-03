type Point = { label: string; value: number };

type TrendChartProps = {
  points: Point[];
  accent?: string;
  height?: number;
};

/**
 * A small, dependency-free cumulative area/line chart rendered as inline SVG —
 * consistent with the app's hand-rolled visual approach. Scales to its
 * container width via a fixed viewBox.
 */
export default function TrendChart({ points, accent = 'var(--teal)', height = 120 }: TrendChartProps) {
  const W = 320;
  const H = height;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 18;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxV = Math.max(1, ...points.map((p) => p.value));
  const n = points.length;

  const x = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / maxV) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${x(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const gradId = 'trend-grad';
  const lastValue = points[n - 1]?.value ?? 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block', overflow: 'visible' }} role="img" aria-label={`Trend ending at ${lastValue}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* baseline */}
      <line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke="var(--card-border)" strokeWidth="1" />

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* end dot */}
      <circle cx={x(n - 1)} cy={y(lastValue)} r="3.5" fill={accent} stroke="#fff" strokeWidth="1.5" />

      {/* endpoint labels */}
      <text x={padL} y={H - 5} fontSize="9" fontWeight="700" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-ui)' }}>{points[0]?.label}</text>
      <text x={W - padR} y={H - 5} fontSize="9" fontWeight="700" fill="var(--text-muted)" textAnchor="end" style={{ fontFamily: 'var(--font-ui)' }}>{points[n - 1]?.label}</text>
    </svg>
  );
}
