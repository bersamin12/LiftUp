'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import BadgeIcon from '@/components/BadgeIcon';
import BadgeReveal from '@/components/BadgeReveal';

export default function RealtimeNotifier({ residentId }: { residentId: string }) {
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<any | null>(null);
  const [unlockRecordId, setUnlockRecordId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkBadges() {
      const { data } = await supabase
        .from('badge_unlocks')
        .select('id, badges(*)')
        .eq('resident_id', residentId)
        .eq('shown', false)
        .limit(1)
        .maybeSingle();
      
      if (data && data.badges) {
        setUnlockedBadge(data.badges);
        setUnlockRecordId(data.id);
      }
    }
    checkBadges();

    const channelPledges = supabase
      .channel('pledges-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pledges',
          filter: `resident_id=eq.${residentId}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;
          
          if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
            setToast({ message: '🎉 Your item was collected! +50 Points', visible: true });
            setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 5000);
            router.refresh();
          } else if (newStatus === 'declined' && oldStatus !== 'declined') {
            setToast({ message: 'Your item was declined.', visible: true });
            setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 5000);
          } else if (newStatus === 'postponed' && oldStatus !== 'postponed') {
            setToast({ message: 'Your item pickup was postponed.', visible: true });
            setTimeout(() => setToast(prev => prev ? { ...prev, visible: false } : null), 5000);
          }
        }
      )
      .subscribe();

    const channelBadges = supabase
      .channel('badges-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'badge_unlocks',
          filter: `resident_id=eq.${residentId}`
        },
        () => {
          checkBadges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelPledges);
      supabase.removeChannel(channelBadges);
    };
  }, [residentId, router, supabase]);

  const dismissBadge = async () => {
    if (unlockRecordId) {
      const { dismissBadgeAction } = await import('@/app/actions/badges');
      try {
        await dismissBadgeAction(unlockRecordId);
      } catch (err) {
        console.error(err);
      }
    }
    setUnlockedBadge(null);
    setUnlockRecordId(null);
  };

  return (
    <>
      {toast && toast.visible && (
        <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none' }}>
          <div
            style={{
              background: 'var(--teal)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 999,
              font: '800 14px var(--font-ui)',
              boxShadow: '0 8px 24px rgba(20, 116, 111, 0.4)',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {toast.message}
          </div>
        </div>
      )}

      {unlockedBadge && (
        <div className="fade-in" style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
          <BadgeReveal
            name={unlockedBadge.name}
            description={unlockedBadge.description || 'You just hit a new milestone in your community!'}
            icon={<BadgeIcon iconKey={unlockedBadge.icon_key} color={unlockedBadge.accent_color || 'var(--rust)'} size={76} />}
            shareText={`I just earned the "${unlockedBadge.name}" badge on LiftUp! ${unlockedBadge.description || ''}`}
            onSkip={dismissBadge}
            onPrimary={dismissBadge}
          />
        </div>
      )}
    </>
  );
}
