'use client';

import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppScreen from '@/components/layout/AppScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';

const MANUAL_CATEGORIES = ['Clothing', 'Books', 'Toys', 'Electronics', 'Furniture', 'Other'];
const MANUAL_CONDITIONS = ['Like New', 'Well-Used', 'Needs Repair', 'Not Working'];

export default function VoicePledgePage() {
  return (
    <Suspense fallback={null}>
      <VoicePledgeContent />
    </Suspense>
  );
}

function VoicePledgeContent() {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [tags, setTags] = useState<{ category: string, condition: string, sizeBucket: string, needsTwoCrew: boolean } | null>(null);
  const [error, setError] = useState('');
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualCategory, setManualCategory] = useState('');
  const [manualCondition, setManualCondition] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const isInterestMode = !runId;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setError('');
    } catch (err) {
      console.error('Error accessing microphone', err);
      setError('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleUpload = async (audioBlob: Blob) => {
    setTranscribing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const res = await fetch('/api/pledge/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Transcription failed');
      
      const data = await res.json();
      setTranscription(data.transcription);
      setTags(data.tags);
    } catch (err) {
      setError('Could not transcribe audio. Please try again or use the photo option.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleContinue = async () => {
    if (isInterestMode) {
      const res = await fetch('/api/interest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: tags?.category || null, note: transcription || null }),
      });
      if (res.ok) {
        router.push('/pledge/interest?done=1');
      } else {
        setError('Failed to register interest');
      }
      return;
    }

    // Confirm pledge with extracted tags
    const res = await fetch('/api/pledge/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection_run_id: runId,
        voice_transcript: transcription,
        ai_suggested_category: tags?.category,
        ai_suggested_condition: tags?.condition,
        ai_suggested_size: tags?.sizeBucket,
        confirmed_category: tags?.category,
        confirmed_condition: tags?.condition,
        size_bucket: tags?.sizeBucket,
        needs_two_crew: tags?.needsTwoCrew,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/pledge/confirmed?pledgeId=${data.pledge.id}`);
    } else {
      setError('Failed to confirm pledge');
    }
  };

  const handleManualContinue = async () => {
    if (isInterestMode) {
      const res = await fetch('/api/interest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: manualCategory || null,
          note: manualCondition ? `Condition: ${manualCondition}` : null,
        }),
      });
      if (res.ok) {
        router.push('/pledge/interest?done=1');
      } else {
        setError('Failed to register interest');
      }
      return;
    }

    const res = await fetch('/api/pledge/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection_run_id: runId,
        confirmed_category: manualCategory,
        confirmed_condition: manualCondition,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/pledge/confirmed?pledgeId=${data.pledge.id}`);
    } else {
      setError('Failed to confirm pledge');
    }
  };

  const footer = transcription
    ? <button onClick={handleContinue} className="btn-primary" style={{ padding: 19, borderRadius: 16, fontSize: 19 }}>Continue</button>
    : showManualFallback && manualCategory && manualCondition
      ? <button onClick={handleManualContinue} className="btn-primary" style={{ padding: 19, borderRadius: 16, fontSize: 19 }}>Continue</button>
      : undefined;

  return (
    <AppScreen background="#f4f7f2" footer={footer}>
      <ScreenHeader variant="hero" title="Tell us about it" subtitle="Just talk, we'll do the rest" />

      <div style={{ padding: '18px 22px 0' }}>
        {error && <div style={{ color: 'var(--rust)', font: '700 12px var(--font-ui)', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid var(--input-border)', borderRadius: 16, padding: 12 }}>
          <span style={{ width: 52, height: 52, borderRadius: 12, background: 'repeating-linear-gradient(45deg,#e9e5db,#e9e5db 7px,#e0dbcf 7px,#e0dbcf 14px)', flex: '0 0 auto' }}></span>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ font: '800 15px var(--font-ui)', color: 'var(--text-dark)' }}>Photo skipped</div>
            <div style={{ font: '700 13px var(--font-ui)', color: 'var(--text-muted)' }}>Using voice only</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 22px 0' }}>
        {!transcription && !transcribing ? (
          <>
            <button 
              onClick={recording ? stopRecording : startRecording}
              style={{ 
                border: 'none', width: 132, height: 132, borderRadius: '50%', 
                background: recording ? 'var(--rust-deeper)' : 'var(--rust)', 
                boxShadow: recording ? 'none' : '0 12px 26px -10px rgba(198,90,52,.7),0 0 0 10px rgba(198,90,52,.14)', 
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              {recording ? (
                <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 8 }}></div>
              ) : (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2.5" width="6" height="12" rx="3"></rect>
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0"></path>
                  <path d="M12 17.5V21"></path>
                </svg>
              )}
            </button>
            <div style={{ font: '800 20px var(--font-ui)', color: 'var(--text-dark)', marginTop: 16 }}>
              {recording ? 'Listening...' : 'Record a voice note'}
            </div>
            <div style={{ font: '700 15px var(--font-ui)', color: 'var(--text-mid)', marginTop: 2 }}>
              {recording ? 'Tap to stop' : 'Tell us what this is'}
            </div>
            {recording && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 14, height: 26 }}>
                 <span style={{ width: 4, height: 10, background: '#d3a06f', borderRadius: 2, animation: 'bob 0.5s infinite alternate' }}></span>
                 <span style={{ width: 4, height: 20, background: 'var(--rust)', borderRadius: 2, animation: 'bob 0.4s infinite alternate' }}></span>
                 <span style={{ width: 4, height: 14, background: '#d3a06f', borderRadius: 2, animation: 'bob 0.6s infinite alternate' }}></span>
                 <span style={{ width: 4, height: 24, background: 'var(--rust)', borderRadius: 2, animation: 'bob 0.3s infinite alternate' }}></span>
                 <span style={{ width: 4, height: 16, background: '#d3a06f', borderRadius: 2, animation: 'bob 0.5s infinite alternate' }}></span>
              </div>
            )}

            {!recording && !showManualFallback && (
              <button
                onClick={() => setShowManualFallback(true)}
                style={{ background: 'none', border: 'none', font: '700 13px var(--font-ui)', color: 'var(--text-mid)', marginTop: 18, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Prefer to tap instead? The category chips still work
              </button>
            )}

            {showManualFallback && (
              <div style={{ marginTop: 18, background: '#fff', border: '1px solid var(--input-border)', borderRadius: 16, padding: 15, textAlign: 'left' }}>
                <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 8 }}>CATEGORY</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {MANUAL_CATEGORIES.map(cat => (
                    <span key={cat} onClick={() => setManualCategory(cat)} className={`chip ${manualCategory === cat ? 'selected' : ''}`}>
                      {cat} {manualCategory === cat && '✓'}
                    </span>
                  ))}
                </div>
                <div style={{ font: '800 11px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 8 }}>CONDITION</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {MANUAL_CONDITIONS.map(cond => (
                    <span key={cond} onClick={() => setManualCondition(cond)} className={`chip ${manualCondition === cond ? 'selected-amber' : ''}`}>
                      {cond} {manualCondition === cond && '✓'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : transcribing ? (
          <div style={{ marginTop: 40, font: '800 16px var(--font-ui)', color: 'var(--teal)' }}>
            Transcribing audio...
          </div>
        ) : (
          <div style={{ margin: '16px 0 0', background: '#fff', border: '1px solid var(--input-border)', borderRadius: 16, padding: '14px 15px', textAlign: 'left' }}>
            <div style={{ font: '800 12px var(--font-ui)', color: 'var(--text-muted)', marginBottom: 6 }}>WHAT WE HEARD</div>
            <div style={{ font: '700 16px var(--font-ui)', color: 'var(--text-dark)', lineHeight: 1.4 }}>
              "{transcription}"
            </div>
            
            {tags && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--input-border)' }}>
                <div style={{ font: '800 12px var(--font-ui)', color: 'var(--teal)', marginBottom: 6 }}>AI EXTRACTED TAGS</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="chip selected">{tags.category}</span>
                  <span className="chip selected-amber">{tags.condition}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppScreen>
  );
}
