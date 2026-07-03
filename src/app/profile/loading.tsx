import AppScreen from '@/components/layout/AppScreen';
import Skeleton from '@/components/layout/Skeleton';

export default function ProfileLoading() {
  return (
    <AppScreen nav="resident">
      <div style={{ padding: '16px 22px 12px', display: 'flex', alignItems: 'center', gap: 13 }}>
        <Skeleton width={54} height={54} borderRadius="50%" />
        <div>
          <Skeleton width={140} height={20} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={13} />
        </div>
      </div>

      <div style={{ margin: '0 22px' }}>
        <Skeleton height={64} borderRadius={14} />
      </div>

      <div style={{ padding: '24px 22px 8px' }}>
        <Skeleton width={90} height={11} style={{ marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <Skeleton height={52} borderRadius="50%" />
          <Skeleton height={52} borderRadius="50%" />
          <Skeleton height={52} borderRadius="50%" />
          <Skeleton height={52} borderRadius="50%" />
        </div>
      </div>

      <div style={{ padding: '16px 22px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Skeleton height={56} borderRadius={13} />
        <Skeleton height={56} borderRadius={13} />
      </div>
    </AppScreen>
  );
}
