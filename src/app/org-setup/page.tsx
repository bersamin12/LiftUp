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
          Residents see a verified badge once we approve you, usually within 1-2 days.
        </Callout>
      </div>

      {error && <div style={{ margin: '12px 22px 0', color: 'var(--rust)', font: '700 12px var(--font-ui)' }}>{error}</div>}

      <form id="org-setup-form" onSubmit={handleSave} style={{ padding: '18px 22px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Organisation name</div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Willing Hearts"
            className="input"
            style={{ background: '#fff', border: '1.5px solid var(--teal)', fontWeight: 800, fontSize: 14 }}
            required
          />
        </div>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>UEN / Registration no.</div>
          <input
            type="text"
            value={uen}
            onChange={e => setUen(e.target.value)}
            placeholder="e.g. S35SS0006K"
            className="input"
            style={{ background: '#fff', fontWeight: 800, fontSize: 14 }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Contact person</div>
            <input
              type="text"
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              placeholder="e.g. Grace Lim"
              className="input"
              style={{ background: '#fff', fontWeight: 800, fontSize: 14 }}
            />
          </div>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Role</div>
            <input
              type="text"
              value={contactRole}
              onChange={e => setContactRole(e.target.value)}
              placeholder="Coordinator"
              className="input"
              style={{ background: '#fff', fontWeight: 800, fontSize: 14 }}
            />
          </div>
        </div>
      </form>
    </AppScreen>
  );
}
