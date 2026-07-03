'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/actions/auth';

export default function CoordinatorBottomNav() {
  const pathname = usePathname();
  const isCampaigns = pathname === '/coordinator';
  const isAnalytics = pathname.startsWith('/coordinator/analytics');

  return (
    <div className="bottom-nav">
      <Link href="/coordinator" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: isCampaigns ? 'var(--teal)' : 'var(--text-muted)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <span style={{ font: '800 10px var(--font-ui)' }}>Campaigns</span>
      </Link>

      <Link href="/coordinator/analytics" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: isAnalytics ? 'var(--teal)' : 'var(--text-muted)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        <span style={{ font: '800 10px var(--font-ui)' }}>Analytics</span>
      </Link>

      <form action={signOut} style={{ display: 'flex' }}>
        <button type="submit" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span style={{ font: '800 10px var(--font-ui)' }}>Log Out</span>
        </button>
      </form>
    </div>
  );
}
