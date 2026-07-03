import Link from 'next/link';
import type { ReactNode, CSSProperties } from 'react';
import DemandHeatmap from '@/components/DemandHeatmap';
import CategoryBar from '@/components/CategoryBar';

// Sample Yishun blocks (real coordinates) for the landing demand-map preview.
type SampleBlock = { block_id: string; block_number: string; street_name: string; lat: number; lng: number; interestCount: number; categoryBreakdown: Record<string, number> };
const SAMPLE_DEMAND_BLOCKS: SampleBlock[] = [
  { block_id: 's1', block_number: '110', street_name: 'Yishun Ring Rd', lat: 1.4325, lng: 103.8298, interestCount: 6, categoryBreakdown: { Clothing: 4, Toys: 2 } },
  { block_id: 's2', block_number: '101', street_name: 'Yishun Ave 5',   lat: 1.4305, lng: 103.8277, interestCount: 5, categoryBreakdown: { Clothing: 3, Books: 2 } },
  { block_id: 's3', block_number: '104', street_name: 'Yishun Ring Rd', lat: 1.4297, lng: 103.8312, interestCount: 4, categoryBreakdown: { Toys: 2, Clothing: 2 } },
  { block_id: 's4', block_number: '103', street_name: 'Yishun Ring Rd', lat: 1.4288, lng: 103.8305, interestCount: 3, categoryBreakdown: { Electronics: 2, Household: 1 } },
  { block_id: 's5', block_number: '105', street_name: 'Yishun Ring Rd', lat: 1.4311, lng: 103.8321, interestCount: 2, categoryBreakdown: { Furniture: 1, Books: 1 } },
];

type Stat = {
  icon: IconName;
  number: string;
  label: string;
  detail: string;
  source: string;
};

type IconName = 'shirt' | 'house' | 'warning' | 'heart' | 'target' | 'box' | 'door' | 'pin' | 'ribbon' | 'loop' | 'flyer' | 'question' | 'camera';

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
    case 'flyer':
      return <svg {...common}><path d="M6 2h9l3 3v17H6z" /><path d="M15 2v3h3" /><path d="M9 12h6M9 16h6" /></svg>;
    case 'question':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.8-2.4 2-2.4 3.8" /><path d="M12 17h.01" /></svg>;
    case 'camera':
      return <svg {...common}><path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></svg>;
  }
}

// ─── "How drives work today" — the origin story ─────────────────
const TODAY_STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'flyer',
    title: 'A volunteer walks the block',
    body: 'Leaving a flyer at every door, with a date printed on it.',
  },
  {
    icon: 'box',
    title: 'Residents leave items outside',
    body: "Anyone who wants to give something sets it outside their unit.",
  },
  {
    icon: 'question',
    title: 'The volunteer returns, blind',
    body: "On the printed date, they come back with no idea what's waiting, or where.",
  },
];

const WASTE_STATS: Stat[] = [
  {
    icon: 'shirt',
    number: '3%',
    label: 'of textile & leather waste is recycled',
    detail: '231,000 tonnes generated in 2025, only 6,000 tonnes recycled',
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
    detail: "nearly 3x today's rate. LiftUp is built for this exact goal",
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

// ─── "How LiftUp solves it" — matches the 4 mechanisms in the script ─────
const SOLUTION_PROPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'camera',
    title: 'Pledge with a photo or voice note',
    body: 'AI tags the category, condition, and size automatically. No forms to fill in.',
  },
  {
    icon: 'pin',
    title: 'A live map for every drive',
    body: 'Charities see exactly which blocks and units have something waiting, flagged if it needs extra hands.',
  },
  {
    icon: 'target',
    title: 'Demand before the drive is scheduled',
    body: 'Charities know where to run their next drive instead of guessing.',
  },
  {
    icon: 'ribbon',
    title: 'Giving becomes a habit',
    body: 'Points, badges, and a block leaderboard keep residents coming back.',
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

      {/* 1. HOOK — opening line of the script */}
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
            Our app, LiftUp, is a gamified community donation platform that streamlines the donation
            process for both residents and charities.
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

      {/* 2. ORIGIN STORY — "the idea came from watching how drives work today" */}
      <Section background="var(--off-white)">
        <Eyebrow color="var(--teal)">Where the idea came from</Eyebrow>
        <div className="fade-in" style={{ textAlign: 'center', font: '800 28px var(--font-serif)', color: 'var(--text-dark)', maxWidth: 640, margin: '0 auto 12px' }}>
          How donation drives work today
        </div>
        <div className="fade-in" style={{ textAlign: 'center', font: '700 15px var(--font-ui)', color: 'var(--text-mid)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.55 }}>
          We watched how community donation drives actually run in HDB estates.
        </div>
        <div className="landing-stats-grid">
          {TODAY_STEPS.map((step, i) => (
            <div key={step.title} className="fade-in" style={{ animationDelay: `${i * 70}ms`, textAlign: 'center', padding: '0 16px' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', border: '2px solid var(--card-border)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: 800, position: 'relative' }}>
                <Icon name={step.icon} size={24} />
                <span style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)', color: '#fff', font: '800 11px var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              </div>
              <div style={{ font: '800 15px var(--font-ui)', color: 'var(--text-dark)', marginTop: 16 }}>{step.title}</div>
              <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-mid)', marginTop: 6, lineHeight: 1.5 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. THE PROBLEM — "the volunteer is working blind" */}
      <Section background="var(--warn-bg)">
        <Eyebrow color="var(--rust)">The problem</Eyebrow>
        <div className="fade-in" style={{ textAlign: 'center', font: '800 30px var(--font-serif)', color: 'var(--text-dark)', maxWidth: 680, margin: '0 auto 20px' }}>
          The volunteer is working blind
        </div>
        <div className="fade-in" style={{ textAlign: 'center', font: '700 16px var(--font-ui)', color: 'var(--text-mid)', maxWidth: 640, margin: '0 auto', lineHeight: 1.65 }}>
          They have no idea which units actually left something out, what it is, or whether it&apos;s a single
          bag or a wardrobe that needs two people to carry. So they walk every floor and check every gate,
          most of which have nothing waiting, for a process that could be planned in minutes instead of hours.
        </div>

        <div style={{ marginTop: 56 }}>
          <div className="fade-in" style={{ textAlign: 'center', font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 24 }}>
            And the stakes are bigger than one estate:
          </div>
          <div className="landing-stats-grid">
            {WASTE_STATS.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} delay={i * 70} accent="var(--rust)" tint="rgba(198,90,52,.12)" />
            ))}
          </div>
        </div>
      </Section>

      {/* Closing the loop bridge */}
      <Section background="var(--off-white)" padding="56px 24px 0">
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ flex: 1, maxWidth: 220, height: 1, background: 'var(--card-border)' }} />
          <div style={{ width: 52, height: 52, borderRadius: '50%', flex: '0 0 auto', background: 'linear-gradient(135deg, var(--rust) 0%, var(--teal) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: 'var(--shadow-card)' }}>
            <Icon name="loop" size={24} />
          </div>
          <div style={{ flex: 1, maxWidth: 220, height: 1, background: 'var(--card-border)' }} />
        </div>
        <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', gap: 60, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ font: '800 12px var(--font-ui)', color: 'var(--rust)', textAlign: 'center' }}>What we throw away</div>
          <div style={{ font: '800 12px var(--font-ui)', color: 'var(--teal)', textAlign: 'center' }}>Who could use it instead</div>
        </div>
      </Section>

      {/* 4. WHO BENEFITS — circular economy stats, before the solution */}
      <Section background="var(--teal-light-bg)">
        <Eyebrow color="var(--teal-dark)">Closing the loop</Eyebrow>
        <div className="landing-stats-grid">
          {LOOP_STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} delay={i * 70} accent="var(--teal-dark)" tint="var(--teal-light-bg)" />
          ))}
        </div>
      </Section>

      {/* 5. THE SOLUTION — "LiftUp solves this by..." */}
      <Section background="var(--off-white)">
        <Eyebrow color="var(--teal)">The solution</Eyebrow>
        <div className="fade-in" style={{ textAlign: 'center', font: '800 30px var(--font-serif)', color: 'var(--text-dark)', maxWidth: 680, margin: '0 auto 16px' }}>
          Putting that information in the volunteer&apos;s hands, before they ever leave the void deck
        </div>
        <div className="fade-in" style={{ textAlign: 'center', font: '700 14px var(--font-ui)', color: 'var(--text-mid)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.55 }}>
          And because giving earns points, badges, and a spot on the block leaderboard, residents keep coming
          back, turning a one-off flyer drop into a habit.
        </div>
        <div className="landing-stats-grid landing-stats-grid--4">
          {SOLUTION_PROPS.map((prop, i) => (
            <div key={prop.title} className="fade-in" style={{ animationDelay: `${i * 70}ms`, textAlign: 'center', padding: '0 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 15, background: 'var(--amber-pale)', color: 'var(--amber-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Icon name={prop.icon} size={26} />
              </div>
              <div style={{ font: '800 16px var(--font-ui)', color: 'var(--text-dark)', marginTop: 18 }}>{prop.title}</div>
              <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-mid)', marginTop: 8, lineHeight: 1.55 }}>{prop.body}</div>
            </div>
          ))}
        </div>

        {/* Live product preview — real components fed sample data */}
        <div style={{ marginTop: 60 }}>
          <div className="fade-in" style={{ textAlign: 'center', font: '800 12px var(--font-ui)', color: 'var(--teal)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 18 }}>
            See it in action
          </div>

          <div className="fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>
            <DemandHeatmap blocks={SAMPLE_DEMAND_BLOCKS} />
            <div style={{ textAlign: 'center', font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 12 }}>
              Every pin is a block with residents waiting to give. Bigger, redder pins mean more demand, so charities know exactly where to run the next drive.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, maxWidth: 760, margin: '28px auto 0' }}>
            <div className="card fade-in" style={{ flex: '1 1 300px', padding: 18 }}>
              <div style={{ font: '800 14px var(--font-serif)', color: 'var(--text-dark)' }}>We think this is...</div>
              <div style={{ font: '700 11px var(--font-ui)', color: 'var(--rust)', marginBottom: 12 }}>Snap a photo, AI tags it. Tap a chip to correct us.</div>
              <div className="section-label" style={{ marginBottom: 6 }}>Category</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 13 }}>
                <span className="chip selected">Clothing</span>
                <span className="chip">Books</span>
                <span className="chip">Toys</span>
              </div>
              <div className="section-label" style={{ marginBottom: 6 }}>Condition</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="chip selected-amber">Like New</span>
                <span className="chip">Well-Used</span>
              </div>
            </div>

            <div className="card fade-in" style={{ flex: '1 1 300px', padding: 18 }}>
              <div className="section-label" style={{ marginBottom: 14 }}>Floors pitching in</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <CategoryBar label="Floor 08" count={12} total={12} color="var(--amber)" />
                <CategoryBar label="Floor 12" count={9} total={12} />
                <CategoryBar label="Floor 03" count={6} total={12} />
              </div>
              <div style={{ font: '700 12px var(--font-ui)', color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.5 }}>
                Points, badges, and a friendly block leaderboard turn a one-off drop-off into a habit.
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Closing CTA */}
      <div style={{ background: 'linear-gradient(160deg, var(--rust) 0%, var(--rust-deeper) 100%)' }}>
        <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ font: '800 30px var(--font-serif)', color: '#fff' }}>Ready to see it in action?</div>
          <div style={{ font: '700 15px var(--font-ui)', color: 'rgba(255,255,255,.8)', marginTop: 10 }}>
            The demo takes two minutes, and one less bag of clothes in the incinerator.
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
