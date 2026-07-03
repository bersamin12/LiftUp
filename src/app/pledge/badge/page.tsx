'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppScreen from '@/components/layout/AppScreen';
import BadgeReveal from '@/components/BadgeReveal';

export default function BadgeUnlockPage() {
  return (
    <Suspense fallback={null}>
      <BadgeUnlockContent />
    </Suspense>
  );
}

function BadgeUnlockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const badgeName = searchParams.get('name') || 'First Give';
  const badgeDescription = searchParams.get('description')
    || "Your very first donation is on its way to a neighbour. Terima kasih for starting the chain ♥";

  return (
    <AppScreen background="var(--teal)" style={{ padding: 0 }}>
      <BadgeReveal
        name={badgeName}
        description={badgeDescription}
        icon={
          <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="var(--rust)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20s-6-4.4-6-9a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 18 11c0 4.6-6 9-6 9z"></path>
          </svg>
        }
        shareText={`I just earned the "${badgeName}" badge on LiftUp! ${badgeDescription}`}
        onSkip={() => router.push('/profile')}
        onPrimary={() => router.push('/profile')}
      />
    </AppScreen>
  );
}
