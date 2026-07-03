'use client';

import { useState } from 'react';
import AppScreen from '@/components/layout/AppScreen';
import Callout from '@/components/layout/Callout';

export default function OrgSetupPage() {
  const [name, setName] = useState('');
  const [uen, setUen] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !uen) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coordinator/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, uen, contact_person: contactPerson, contact_role: contactRole }),
      });
      if (res.ok) {
        window.location.href = '/coordinator';
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const footer = (
    <button
      type="submit"
      form="org-setup-form"
      disabled={!name || !uen || loading}
      className="btn-primary"
      style={{ opacity: (!name || !uen || loading) ? 0.5 : 1 }}
    >
      {loading ? 'Submitting...' : 'Submit for verification'}
    </button>
  );

  return (
    <AppScreen footer={footer}>
      <div style={{ padding: '16px 22px 4px' }}>
        <div style={{ font: '700 22px var(--font-serif)', color: 'var(--text-dark)' }}>Verify your organisation</div>
        <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)', marginTop: 2 }}>One more step to earn residents&apos; trust</div>
      </div>

      <div style={{ margin: '16px 22px 0' }}>
        <Callout tone="amber">
          Residents see a verified badge once we approve you — usually within 1–2 days.
        </Callout>
      </div>

      {error && <div style={{ margin: '12px 22px 0', color: 'var(--rust)', font: '700 12px var(--font-ui)' }}>{error}</div>}

      <form id="org-setup-form" onSubmit={handleSave} style={{ padding: '18px 22px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 6 }}>ORGANISATION NAME</div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Willing Hearts"
            style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1.5px solid var(--teal)', borderRadius: 13, padding: 13, font: '800 14px var(--font-ui)', color: 'var(--text-dark)', outline: 'none' }}
            required
          />
        </div>
        <div>
          <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 6 }}>UEN / REGISTRATION NO.</div>
          <input
            type="text"
            value={uen}
            onChange={e => setUen(e.target.value)}
            placeholder="e.g. S35SS0006K"
            style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid var(--input-border)', borderRadius: 13, padding: 13, font: '800 14px var(--font-ui)', color: 'var(--text-dark)', outline: 'none' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
          <div>
            <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 6 }}>CONTACT PERSON</div>
            <input
              type="text"
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              placeholder="e.g. Grace Lim"
              style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid var(--input-border)', borderRadius: 13, padding: 13, font: '800 14px var(--font-ui)', color: 'var(--text-dark)', outline: 'none' }}
            />
          </div>
          <div>
            <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 6 }}>ROLE</div>
            <input
              type="text"
              value={contactRole}
              onChange={e => setContactRole(e.target.value)}
              placeholder="Coordinator"
              style={{ width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid var(--input-border)', borderRadius: 13, padding: 13, font: '800 14px var(--font-ui)', color: 'var(--text-dark)', outline: 'none' }}
            />
          </div>
        </div>
      </form>
    </AppScreen>
  );
}
