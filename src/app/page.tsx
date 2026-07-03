import Link from 'next/link';
import type { ReactNode, CSSProperties } from 'react';

type Stat = {
  icon: IconName;
  number: string;
  label: string;
  detail: string;
  source: string;
};

type IconName = 'shirt' | 'house' | 'warning' | 'heart' | 'target' | 'box' | 'door' | 'pin' | 'ribbon' | 'loop';

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'shirt':
      return <svg {...common}><path d="M9 3 4 7l2 3 2-1.5V20h8V8.5L18 10l2-3-5-4c-.6 1.2-1.7 1.8-3 1.8S9.6 4.2 9 3z" /></svg>;
    case 'house':
      return <svg {...common}><path d="M4 11 12 4l8 7" /><path d="M6 10v9h12v-9" /></svg>;
    case 'warning':
      return <svg {...common}><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4" /><path d="M12 17h.01" /></svg>;
    case 'heart':
      return <svg {...common}><path d="M12 20s-6-4.4-6-9a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 18 11c0 4.6-6 9-6 9z" /></svg>;
    case 'target':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></svg>;
    case 'box':
      return <svg {...common}><path d="M3 8 12 4l9 4-9 4-9-4z" /><path d="M3 8v9l9 4 9-4V8" /><path d="M12 12v9" /></svg>;
    case 'door':
      return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M14.5 12h.01" /></svg>;
    case 'pin':
      return <svg {...common}><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>;
    case 'ribbon':
      return <svg {...common}><circle cx="12" cy="8" r="5" /><path d="M9 12.5 7 21l5-3 5 3-2-8.5" /></svg>;
    case 'loop':
      return <svg {...common}><path d="M17 2 21 6l-4 4" /><path d="M3 12v-1a4 4 0 0 1 4-4h14" /><path d="M7 22 3 18l4-4" /><path d="M21 12v1a4 4 0 0 1-4 4H3" /></svg>;
  }
}

const WASTE_STATS: Stat[] = [
  {
    icon: 'shirt',
    number: '3%',
    label: 'of textile & leather waste is recycled',
    detail: '231,000 tonnes generated in 2025 — only 6,000 tonnes recycled',
    source: 'NEA, Waste Statistics & Overall Recycling, 2025',
  },
  {
    icon: 'house',
    number: '11%',
    label: 'household recycling rate',
    detail: 'vs. 67% for the non-domestic (commercial) sector',
    source: 'NEA, Waste Statistics & Overall Recycling, 2025',
  },
  {
    icon: 'warning',
    number: '2035',
    label: 'Semakau Landfill runs out of space',
    detail: "Singapore's only landfill, at current disposal rates",
    source: 'Ministry of Sustainability & the Environment, Jan 2024',
  },
];

const LOOP_STATS: Stat[] = [
  {
    icon: 'heart',
    number: '22,960',
    label: 'households needed ComCare assistance in 2023',
    detail: 'real families a working reuse economy could directly help',
    source: 'MSF, Supporting Lower-Income Households Trends Report, 2024',
  },
  {
    icon: 'target',
    number: '30%',
    label: "Singapore's 2030 household recycling target",
    detail: "nearly 3x today's rate — LiftUp is built for this exact goal",
    source: 'MSE / NEA, Zero Waste Masterplan',
  },
  {
    icon: 'box',
    number: '700,000kg',
    label: 'of food redistributed a year by Food Bank Singapore',
    detail: 'proof large-scale redistribution already works here',
    source: 'Food Bank Singapore',
  },
];

const VALUE_PROPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'door',
    title: 'No drop-off required',
    body: 'Residents pledge an item from home — a volunteer collects it right at the door.',
  },
  {
    icon: 'pin',
    title: 'Charities see real demand',
    body: 'Pending interest shows up on a live map before a pickup is even scheduled.',
  },
  {
    icon: 'ribbon',
    title: 'Giving is recognised',
    body: 'Points, badges, and a block leaderboard turn donating into a shared habit.',
  },
];

function Section({ background, padding = '72px 24px', style, children }: { background?: string; padding?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div style={{ background, ...style }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding }}>{children}</div>
    </div>
  );
}

function Eyebrow({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div style={{ textAlign: 'center', font: '800 12px var(--font-ui)', color, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 20 }}>
      {children}
    </div>
  );
}

function StatCard({ stat, delay, accent, tint }: { stat: Stat; delay: number; accent: string; tint: string }) {
  return (
    <div
      className="fade-in"
      style={{
        animationDelay: `${delay}ms`,
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 20,
        padding: '26px 24px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 13, background: tint, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icon name={stat.icon} />
      </div>
      <div style={{ font: '800 38px var(--font-serif)', color: accent, lineHeight: 1 }}>{stat.number}</div>
      <div style={{ font: '800 15px var(--font-ui)', color: 'var(--text-dark)', marginTop: 12 }}>{stat.label}</div>
      <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-mid)', marginTop: 6, lineHeight: 1.45 }}>{stat.detail}</div>
      <div style={{ height: 1, background: 'var(--card-border)', margin: '16px 0 12px' }} />
      <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', letterSpacing: '.2px' }}>{stat.source}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--off-white)', minHeight: '100dvh' }}>

      {/* Header */}
      <Section padding="18px 24px">
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--teal-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--amber)' }}></span>
            </span>
            <span style={{ font: '800 18px var(--font-ui)', color: 'var(--text-dark)' }}>LiftUp</span>
          </div>
          <Link href="/login" style={{ font: '800 13px var(--font-ui)', color: 'var(--teal)', textDecoration: 'none' }}>
            Log in
          </Link>
        </div>
      </Section>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 12% 22%, rgba(255,255,255,.10) 0 3px, transparent 3px), ' +
              'radial-gradient(circle at 82% 16%, rgba(217,138,61,.35) 0 5px, transparent 5px), ' +
              'radial-gradient(circle at 90% 68%, rgba(255,255,255,.08) 0 4px, transparent 4px), ' +
              'radial-gradient(circle at 8% 78%, rgba(217,138,61,.3) 0 4px, transparent 4px), ' +
              'radial-gradient(circle at 50% 92%, rgba(255,255,255,.08) 0 3px, transparent 3px)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto', padding: '64px 24px 88px', textAlign: 'center' }}>
          <div className="fade-in" style={{ display: 'inline-block', font: '800 12px var(--font-ui)', color: 'var(--teal-pale)', letterSpacing: '1.2px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '6px 14px', marginBottom: 22 }}>
            A circular economy story
          </div>
          <h1 className="fade-in" style={{ animationDelay: '60ms', font: '800 46px var(--font-serif)', color: '#fff', lineHeight: 1.15, margin: 0 }}>
            97% of what Singapore throws away in clothing never gets a second life.
          </h1>
          <p className="fade-in" style={{ animationDelay: '120ms', font: '700 17px var(--font-ui)', color: 'var(--teal-pale)', marginTop: 20, lineHeight: 1.55 }}>
            LiftUp connects residents who have something to give with the charities and neighbours who need it —
            turning doorstep clutter into someone else&apos;s doorstep delivery.
          </p>
          <Link
            href="/login"
            className="fade-in btn-amber"
            style={{ animationDelay: '180ms', display: 'inline-block', width: 'auto', textDecoration: 'none', marginTop: 30, padding: '16px 32px', fontSize: 16 }}
          >
            Try it now!
          </Link>
        </div>
      </div>

      {/* The waste problem */}
      <Section background="var(--off-white)">
        <Eyebrow color="var(--rust)">The waste problem</Eyebrow>
        <div className="landing-stats-grid">
          {WASTE_STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} delay={i * 70} accent="var(--rust)" tint="rgba(198,90,52,.12)" />
          ))}
        </div>
      </Section>

      {/* Closing the loop bridge */}
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 24px' }}>
        <div style={{ flex: 1, maxWidth: 220, height: 1, background: 'var(--card-border)' }} />
        <div style={{ width: 52, height: 52, borderRadius: '50%', flex: '0 0 auto', background: 'linear-gradient(135deg, var(--rust) 0%, var(--teal) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--shadow-card)' }}>
          <Icon name="loop" size={24} />
        </div>
        <div style={{ flex: 1, maxWidth: 220, height: 1, background: 'var(--card-border)' }} />
      </div>
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', gap: 60, marginTop: 12, padding: '0 24px', flexWrap: 'wrap' }}>
        <div style={{ font: '800 12px var(--font-ui)', color: 'var(--rust)', textAlign: 'center' }}>What we throw away</div>
        <div style={{ font: '800 12px var(--font-ui)', color: 'var(--teal)', textAlign: 'center' }}>Who could use it instead</div>
      </div>

      {/* Circular economy / who benefits */}
      <Section background="var(--teal-light-bg)">
        <Eyebrow color="var(--teal-dark)">Closing the loop</Eyebrow>
        <div className="landing-stats-grid">
          {LOOP_STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} delay={i * 70} accent="var(--teal-dark)" tint="var(--teal-light-bg)" />
          ))}
        </div>
      </Section>

      {/* Why LiftUp */}
      <Section background="var(--off-white)">
        <div className="fade-in" style={{ textAlign: 'center', font: '800 32px var(--font-serif)', color: 'var(--text-dark)', marginBottom: 40 }}>
          Why LiftUp
        </div>
        <div className="landing-stats-grid">
          {VALUE_PROPS.map((prop, i) => (
            <div key={prop.title} className="fade-in" style={{ animationDelay: `${i * 70}ms`, textAlign: 'center', padding: '0 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 15, background: 'var(--amber-pale)', color: 'var(--amber-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Icon name={prop.icon} size={26} />
              </div>
              <div style={{ font: '800 16px var(--font-ui)', color: 'var(--text-dark)', marginTop: 18 }}>{prop.title}</div>
              <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-mid)', marginTop: 8, lineHeight: 1.55 }}>{prop.body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Closing CTA */}
      <div style={{ background: 'linear-gradient(160deg, var(--rust) 0%, var(--rust-deeper) 100%)' }}>
        <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ font: '800 30px var(--font-serif)', color: '#fff' }}>Ready to see it in action?</div>
          <div style={{ font: '700 15px var(--font-ui)', color: 'rgba(255,255,255,.8)', marginTop: 10 }}>
            The demo takes two minutes — and one less bag of clothes in the incinerator.
          </div>
          <Link
            href="/login"
            style={{ display: 'inline-block', width: 'auto', textDecoration: 'none', marginTop: 26, padding: '16px 32px', fontSize: 16, borderRadius: 14, background: '#fff', color: 'var(--rust-deeper)', font: '800 16px var(--font-ui)', boxShadow: '0 10px 24px -12px rgba(0,0,0,.4)' }}
          >
            Get started
          </Link>
        </div>
      </div>

    </div>
  );
}
