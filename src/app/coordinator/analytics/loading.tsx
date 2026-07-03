import AppScreen from '@/components/layout/AppScreen';
import Skeleton from '@/components/layout/Skeleton';

export default function AnalyticsLoading() {
  return (
    <AppScreen nav="coordinator">
      <div style={{ padding: '24px 22px 0' }}>
        <Skeleton width={140} height={22} />
      </div>

      <div style={{ padding: '20px 22px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Skeleton height={80} borderRadius={16} />
        <Skeleton height={80} borderRadius={16} />
      </div>

      <div style={{ padding: '24px 22px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton height={14} />
      </div>
    </AppScreen>
  );
}
