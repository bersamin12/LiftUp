'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

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
        <div className="fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,32,0.9)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--cream-bg)', width: '100%', maxWidth: 320, borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ font: '800 13px var(--font-ui)', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
              New Badge Unlocked!
            </div>
            <div style={{ fontSize: 64, marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>
              {unlockedBadge.icon || '🏅'}
            </div>
            <div style={{ font: '700 24px var(--font-serif)', color: 'var(--text-dark)', marginBottom: 8 }}>
              {unlockedBadge.name}
            </div>
            <div style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.4 }}>
              {unlockedBadge.description || 'You just hit a new milestone in your community!'}
            </div>
            <button 
              onClick={dismissBadge}
              className="btn-primary" 
              style={{ width: '100%', padding: '16px', borderRadius: 14, fontSize: 16, cursor: 'pointer' }}
            >
              Awesome
            </button>
          </div>
        </div>
      )}
    </>
  );
}
