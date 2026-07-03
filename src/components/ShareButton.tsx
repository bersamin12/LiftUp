'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

type ShareButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  style?: CSSProperties;
};

export default function ShareButton({ text, label = 'Share', copiedLabel = 'Copied!', className = 'btn-amber', style }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text, title: 'LiftUp' });
        return;
      } catch {
        // User cancelled or share failed - fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable - nothing more we can do.
    }
  };

  return (
    <button onClick={handleShare} className={className} style={style}>
      {copied ? copiedLabel : label}
    </button>
  );
}
