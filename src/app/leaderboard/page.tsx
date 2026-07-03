import { supabaseService } from '@/lib/supabase-server';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import EmptyState from '@/components/layout/EmptyState';

async function getLeaderboardData() {
  const db = supabaseService();
  const { data, error } = await (db.from('leaderboard_by_floor') as any).select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export default async function LeaderboardPage() {
  const data = await getLeaderboardData();

  // Find most generous floor
  let topFloor = null;
  let totalItems = 0;
  
  if (data.length > 0) {
    topFloor = data.reduce((prev: any, current: any) => (prev.confirmed_pledges > current.confirmed_pledges) ? prev : current);
    totalItems = data.reduce((sum: number, floor: any) => sum + floor.confirmed_pledges, 0);
  }

  // Sort descending
  const sortedData = [...data].sort((a, b) => b.confirmed_pledges - a.confirmed_pledges);

  return (
    <AppScreen>
      <ScreenHeader title="Our block together" subtitle="celebrating everyone" backHref="/profile" />

      {topFloor ? (
        <>
          <div style={{ margin: '12px 22px 0', borderRadius: 'var(--r-hero)', overflow: 'hidden', background: 'var(--amber)', color: '#fff', padding: 18, position: 'relative' }}>
            <div style={{ position: 'absolute', right: -10, top: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }}></div>
            <div style={{ font: '800 12px var(--font-ui)', color: 'var(--amber-pale)', letterSpacing: '.5px' }}>MOST GENEROUS FLOOR</div>
            <div style={{ font: '700 30px var(--font-serif)', marginTop: 4 }}>Floor {String(topFloor.floor_number).padStart(2, '0')} 🌿</div>
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--amber-pale)', marginTop: 4 }}>
              {topFloor.confirmed_pledges} items given by neighbours on this floor
            </div>
          </div>

          <div className="section-label" style={{ padding: '24px 22px 8px' }}>Floors pitching in</div>
          <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            {sortedData.map((floor: any, index: number) => {
              const maxVal = topFloor.confirmed_pledges;
              const percentage = Math.max(5, Math.round((floor.confirmed_pledges / maxVal) * 100));
              const isTop = index === 0;
              
              return (
                <div key={`${floor.block_number}-${floor.floor_number}`} className="fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: '800 13px var(--font-ui)', color: 'var(--text-dark)', marginBottom: 5 }}>
                    <span>Floor {String(floor.floor_number).padStart(2, '0')}</span>
                    <span style={{ font: '700 12px var(--font-ui)', color: isTop ? 'var(--rust)' : 'var(--text-mid)' }}>{floor.confirmed_pledges} items</span>
                  </div>
                  <div className="progress-bar-track" style={{ height: 14 }}>
                    <div className="progress-bar-fill" style={{ width: `${percentage}%`, background: isTop ? 'var(--amber)' : 'var(--teal)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ margin: '24px 22px 0', background: 'var(--teal-light-bg)', border: '1px solid var(--teal-pale)', borderRadius: 14, padding: '13px 15px', textAlign: 'center' }}>
            <div style={{ font: '700 14px var(--font-ui)', color: 'var(--teal-dark)', lineHeight: 1.45 }}>
              Every floor counts. Together Blk {topFloor.block_number} has given <b style={{ color: 'var(--teal)' }}>{totalItems} items</b> in total.
            </div>
          </div>
          <div style={{ padding: '16px 22px', textAlign: 'center', font: '700 12px var(--font-ui)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            We celebrate floors, not individuals. No one is ranked or named.
          </div>
        </>
      ) : (
        <div style={{ padding: 22, marginTop: 40 }}>
          <EmptyState icon="🌿" title="No donations yet" description="Be the first on your floor to give, and this board will fill in as your block joins you." />
        </div>
      )}
    </AppScreen>
  );
}
