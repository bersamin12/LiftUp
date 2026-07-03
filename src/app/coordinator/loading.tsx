import AppScreen from '@/components/layout/AppScreen';
import Skeleton from '@/components/layout/Skeleton';

export default function CoordinatorLoading() {
  return (
    <AppScreen nav="coordinator">
      <div style={{ padding: '24px 22px 0' }}>
        <Skeleton width={90} height={11} style={{ marginBottom: 8 }} />
        <Skeleton width={160} height={24} />
      </div>

      <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton height={78} borderRadius={16} />
        <Skeleton height={78} borderRadius={16} />
        <Skeleton height={78} borderRadius={16} />
      </div>
    </AppScreen>
  );
}
