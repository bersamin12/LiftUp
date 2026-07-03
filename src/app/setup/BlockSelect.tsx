'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BlockSelect({ blocks, residentId }: { blocks: any[], residentId: string }) {
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const filteredBlocks = blocks.filter(b => 
    b.street_name.toLowerCase().includes(search.toLowerCase()) || 
    b.block_number.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const selectedBlockData = blocks.find(b => b.block_id === selectedBlock);

  const handleSave = async () => {
    if (!selectedBlock) return;
    setLoading(true);
    try {
      const res = await fetch('/api/resident/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: selectedBlock }),
      });
      if (res.ok) {
        // Bypass Next.js client router cache to ensure the server component runs fresh
        window.location.href = '/home';
      } else {
        const data = await res.json();
        console.error('Setup failed:', data.error);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <input 
          type="text"
          placeholder="Search for your block (e.g. 118 Ang Mo Kio)"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIsOpen(true);
            setSelectedBlock('');
          }}
          onFocus={() => setIsOpen(true)}
          className="input"
          style={{ padding: 16, border: '1.5px solid var(--teal)', background: '#fff', fontWeight: 800 }}
        />
        {selectedBlockData && !isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            style={{ position: 'absolute', inset: 2, background: '#fff', borderRadius: 'var(--r-input)', padding: 14, font: '800 16px var(--font-ui)', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            Blk {selectedBlockData.block_number} - {selectedBlockData.street_name}
          </div>
        )}
        {isOpen && search && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--card-border)', borderRadius: 14, marginTop: 8, maxHeight: 240, overflowY: 'auto', boxShadow: 'var(--shadow-card)', zIndex: 10 }}>
            {filteredBlocks.length === 0 ? (
              <div style={{ padding: '16px', font: '700 14px var(--font-ui)', color: 'var(--text-muted)' }}>No blocks found</div>
            ) : (
              filteredBlocks.map(b => (
                <div 
                  key={b.block_id}
                  onClick={() => {
                    setSelectedBlock(b.block_id);
                    setSearch(`Blk ${b.block_number} - ${b.street_name}`);
                    setIsOpen(false);
                  }}
                  style={{ padding: '14px 16px', borderBottom: '1px solid var(--cream-bg)', font: '800 14px var(--font-ui)', color: 'var(--text-dark)', cursor: 'pointer' }}
                >
                  Blk {b.block_number} - {b.street_name}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={!selectedBlock || loading}
        className="btn-primary"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
