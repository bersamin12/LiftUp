'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { ensureProfile } from '@/app/actions/auth';
import AppScreen from '@/components/layout/AppScreen';
import Callout from '@/components/layout/Callout';

export default function LoginPage() {
  const [role, setRole] = useState<'resident' | 'organization'>('resident');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = supabaseClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      await processLoginSuccess(data, email);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      await processLoginSuccess(data, email);
    }
  };

  const handleGoogleSignIn = async () => {
    const nextPath = role === 'resident' ? '/home' : '/coordinator';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}&next=${nextPath}`,
      }
    });

    if (error) {
      setError(error.message);
    }
  };

  const processLoginSuccess = async (data: any, userEmail: string) => {
    if (data.user) {
      try {
        await ensureProfile(role, userEmail);
        if (role === 'resident') {
          router.push('/home');
        } else {
          router.push('/coordinator');
        }
      } catch (err) {
        setError('Failed to setup profile');
        setLoading(false);
      }
    }
  };

  return (
    <AppScreen>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, padding: '0 24px' }}>
        <div style={{ width: 48, height: 48, background: 'var(--rust)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 8.5c0 4.5-8 10.5-8 10.5s-8-6-8-10.5a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8z"></path></svg>
        </div>
        <h1 style={{ font: '800 28px var(--font-serif)', color: 'var(--text-dark)', marginTop: 24, marginBottom: 8 }}>Welcome to LiftUp</h1>
        <p style={{ font: '700 14px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 32 }}>
          Log in or sign up below.
        </p>

        {/* Role Toggle */}
        <div className="segment-toggle" style={{ width: '100%', marginBottom: 32 }}>
          <button
            onClick={() => setRole('resident')}
            className={`segment ${role === 'resident' ? 'active' : ''}`}
          >
            Resident
          </button>
          <button
            onClick={() => setRole('organization')}
            className={`segment ${role === 'organization' ? 'active' : ''}`}
          >
            Coordinator
          </button>
        </div>
      </div>

      <div style={{ margin: '22px 22px 0' }}>
        {error && <div style={{ color: 'var(--rust)', font: '700 12px var(--font-ui)', marginBottom: 12, textAlign: 'center' }}>{error}</div>}

        <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 7 }}>EMAIL ADDRESS</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              disabled={loading}
              style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1.5px solid var(--input-border)', borderRadius: 13, padding: 14, font: '800 15px var(--font-ui)', color: 'var(--text-dark)', outline: 'none' }}
            />
          </div>
          <div>
            <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 7 }}>PASSWORD</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1.5px solid var(--input-border)', borderRadius: 13, padding: 14, font: '800 15px var(--font-ui)', color: 'var(--text-dark)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button onClick={handleSignIn} disabled={loading} className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Processing...' : 'Log In'}
            </button>
            <button onClick={handleSignUp} disabled={loading} className="btn-ghost" style={{ flex: 1, display: 'flex', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
              Sign Up
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }}></div>
          <span style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }}></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 13, border: '1.5px solid var(--card-border)', background: '#fff', font: '800 14px var(--font-ui)', color: 'var(--text-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: loading ? 0.7 : 1, transition: 'background 0.2s' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {role === 'resident' && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={() => router.push('/caregiver-setup')}
              style={{ background: 'none', border: 'none', font: '800 13px var(--font-ui)', color: 'var(--teal)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Help somebody signup
            </button>
          </div>
        )}
      </div>

      {role === 'organization' && (
        <div className="fade-in" style={{ margin: '16px 22px 0' }}>
          <Callout tone="teal">
            Organisations complete a short verification step so residents can see you&apos;re a real charity.
          </Callout>
        </div>
      )}
    </AppScreen>
  );
}
