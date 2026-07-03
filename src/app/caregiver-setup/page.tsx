'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Callout from '@/components/layout/Callout';

export default function CaregiverSetupPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [block, setBlock] = useState('');
  const [unit, setUnit] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = supabaseClient();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (phone.length < 8) {
      setError('Please enter a valid mobile number');
      setLoading(false);
      return;
    }

    const fullPhone = phone.startsWith('+') ? phone : `+65${phone}`;

    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });

    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== otp.length) return;

    setError('');
    setLoading(true);

    const fullPhone = phone.startsWith('+') ? phone : `+65${phone}`;

    // Here we are verifying OTP for the dependent. Supabase Auth will log us in as the dependent!
    // This implies the caregiver's device will hold the session for the dependent, 
    // which matches "Do this once, together. After setup, your family member only needs to snap..."
    // Wait, the caregiver is setting this up on the ELDERLY person's phone.
    const { data, error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token,
      type: 'sms',
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.user) {
        try {
          // Call a server action to create the dependent profile
          await fetch('/api/caregiver-setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone: fullPhone, block, unit }),
          });
          
          router.push('/home'); // Go to home logged in as dependent
        } catch (err) {
          setError('Failed to setup profile');
          setLoading(false);
        }
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const footer = step === 'form' ? (
    <button onClick={handleSendOtp} disabled={loading} className="btn-primary" style={{ padding: 16 }}>
      {loading ? 'Sending...' : 'Send code & finish setup'}
    </button>
  ) : (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="tel"
            value={otp[index]}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            style={{
              flex: 1, height: 56, background: '#fff',
              border: `1.5px solid ${otp[index] ? 'var(--teal)' : 'var(--input-border)'}`,
              borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: '800 24px var(--font-ui)', color: 'var(--teal)', textAlign: 'center', outline: 'none'
            }}
          />
        ))}
      </div>
      <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary" style={{ padding: 16 }}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      <div style={{ font: '700 12px var(--font-ui)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
        <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>Change details</button>
      </div>
    </div>
  );

  return (
    <AppScreen footer={footer}>
      <ScreenHeader title="Set up for a family member" />

      <div style={{ margin: '8px 22px 0' }}>
        <Callout
          tone="teal"
          icon={
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.2"></circle>
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0"></path>
              <path d="M17.5 8v6M14.5 11h6"></path>
            </svg>
          }
        >
          Do this once, together. After setup, your family member only needs to snap a photo or talk. No other steps.
        </Callout>
      </div>

      <div style={{ padding: '16px 22px 0' }}>
        {error && <div style={{ color: 'var(--rust)', font: '700 12px var(--font-ui)', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        
        <div className="section-label" style={{ marginBottom: 6 }}>Their name</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mdm Aisha Rahman"
          disabled={step === 'otp'}
          className="input"
          style={{ background: '#fff', border: `1.5px solid ${step === 'otp' ? 'var(--input-border)' : 'var(--teal)'}`, fontWeight: 800, fontSize: 15 }}
        />

        <div className="section-label" style={{ margin: '16px 0 6px' }}>Their mobile number</div>
        <div style={{ display: 'flex', gap: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--canvas-bg)', border: '1px solid var(--input-border)', borderRadius: 'var(--r-input)', padding: '0 14px', font: '800 15px var(--font-ui)', color: 'var(--text-mid)' }}>+65</div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="8234 5566"
            disabled={step === 'otp'}
            className="input"
            style={{ flex: 1, background: '#fff', fontWeight: 800, fontSize: 15 }}
          />
        </div>
        <div style={{ font: '700 11px var(--font-ui)', color: 'var(--text-muted)', marginTop: 6 }}>We'll text a one-time code to confirm it's theirs.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Block</div>
            <input
              type="text"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              placeholder="Blk 118"
              disabled={step === 'otp'}
              className="input"
              style={{ background: '#fff', fontWeight: 800, fontSize: 15 }}
            />
          </div>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Unit</div>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="#08-232"
              disabled={step === 'otp'}
              className="input"
              style={{ background: '#fff', fontWeight: 800, fontSize: 15 }}
            />
          </div>
        </div>
      </div>

      <div style={{ margin: '16px 22px 0' }}>
        <Callout tone="amber">
          Setup only. The app itself is never voice-navigated. Voice is used only to describe a donation.
        </Callout>
      </div>
    </AppScreen>
  );
}
