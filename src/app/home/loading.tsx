import AppScreen from '@/components/layout/AppScreen';
import Skeleton from '@/components/layout/Skeleton';

export default function HomeLoading() {
  return (
    <AppScreen nav="resident">
      <div style={{ padding: '14px 22px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, marginRight: 16 }}>
          <Skeleton width={120} height={12} style={{ marginBottom: 8 }} />
          <Skeleton width={180} height={22} />
        </div>
        <Skeleton width={40} height={40} borderRadius="50%" />
      </div>

      <div style={{ padding: '12px 22px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 18, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Skeleton width={44} height={44} borderRadius={12} />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={12} />
            </div>
          </div>
          <Skeleton height={48} style={{ marginBottom: 14 }} />
          <Skeleton height={48} />
        </div>
      </div>
    </AppScreen>
  );
}
