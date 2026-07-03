'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ResidentBottomNav() {
  const pathname = usePathname();
  const isHome = pathname === '/home';
  const isGive = pathname === '/give' || pathname.startsWith('/pledge');
  const isMe = pathname.startsWith('/profile');

  return (
    <div className="bottom-nav">
      <Link href="/home" aria-label="Home" aria-current={isHome ? 'page' : undefined} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 20, height: 18, background: isHome ? 'var(--teal)' : 'var(--text-muted)', clipPath: 'polygon(50% 0,100% 42%,100% 100%,0 100%,0 42%)' }}></span>
        <span style={{ font: '700 10px var(--font-ui)', color: isHome ? 'var(--teal)' : 'var(--text-muted)' }}>Home</span>
      </Link>

      {/* Center "Give" is a persistent primary CTA (raised teal pill); the label
          still reflects active state so Home + Give don't both read as selected. */}
      <Link href="/give" aria-label="Give an item" aria-current={isGive ? 'page' : undefined} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 46, height: 34, borderRadius: 12, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-btn-teal)' }}>
          <span style={{ width: 20, height: 16, border: '2.5px solid #fff', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', border: '2px solid #fff' }}></span>
          </span>
        </span>
        <span style={{ font: '700 10px var(--font-ui)', color: isGive ? 'var(--teal)' : 'var(--text-muted)' }}>Give</span>
      </Link>

      <Link href="/profile" aria-label="My profile" aria-current={isMe ? 'page' : undefined} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 20, height: 18, position: 'relative' }}>
          <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: isMe ? 'var(--teal)' : 'var(--text-muted)' }}></span>
          <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 16, height: 8, borderRadius: '8px 8px 0 0', background: isMe ? 'var(--teal)' : 'var(--text-muted)' }}></span>
        </span>
        <span style={{ font: '700 10px var(--font-ui)', color: isMe ? 'var(--teal)' : 'var(--text-muted)' }}>Me</span>
      </Link>
    </div>
  );
}
