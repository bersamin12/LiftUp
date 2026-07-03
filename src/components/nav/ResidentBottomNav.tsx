'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ResidentBottomNav() {
  const pathname = usePathname();
  const isHome = pathname === '/home';
  const isMe = pathname.startsWith('/profile');

  return (
    <div className="bottom-nav">
      <Link href="/home" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 20, height: 18, background: isHome ? 'var(--teal)' : 'var(--text-muted)', clipPath: 'polygon(50% 0,100% 42%,100% 100%,0 100%,0 42%)' }}></span>
        <span style={{ font: '700 10px var(--font-ui)', color: isHome ? 'var(--teal)' : 'var(--text-muted)' }}>Home</span>
      </Link>

      <Link href="/give" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 46, height: 34, borderRadius: 12, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 20, height: 16, border: '2.5px solid #fff', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', border: '2px solid #fff' }}></span>
          </span>
        </span>
        <span style={{ font: '700 10px var(--font-ui)', color: 'var(--teal)' }}>Give</span>
      </Link>

      <Link href="/profile" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 20, height: 18, position: 'relative' }}>
          <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: isMe ? 'var(--teal)' : 'var(--text-muted)' }}></span>
          <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 16, height: 8, borderRadius: '8px 8px 0 0', background: isMe ? 'var(--teal)' : 'var(--text-muted)' }}></span>
        </span>
        <span style={{ font: '700 10px var(--font-ui)', color: isMe ? 'var(--teal)' : 'var(--text-muted)' }}>Me</span>
      </Link>
    </div>
  );
}
