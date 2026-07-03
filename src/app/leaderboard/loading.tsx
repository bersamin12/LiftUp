import AppScreen from '@/components/layout/AppScreen';
import Skeleton from '@/components/layout/Skeleton';

export default function LeaderboardLoading() {
  return (
    <AppScreen nav="resident">
      <div style={{ padding: '14px 22px 4px' }}>
        <Skeleton width={180} height={20} />
      </div>

      <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton height={14} />
      </div>
    </AppScreen>
  );
}
