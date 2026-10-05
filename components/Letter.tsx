'use client';

import { useState } from 'react';
import type { Report } from '@/lib/schema';
import styles from './Letter.module.css';

export function Letter({ letter }: { letter: Report['letter'] }) {
  const [copied, setCopied] = useState(false);
  const full = `Subject: ${letter.subject}\n\n${letter.body}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      // Older browsers / insecure origins: fall back to a hidden textarea
      const ta = document.createElement('textarea');
      ta.value = full;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className={styles.wrap} aria-labelledby="letter-heading">
      <div className={styles.head}>
        <h2 id="letter-heading" className={styles.heading}>
          {letter.kind === 'cancellation' ? 'Your way out, already written' : 'Ask them to change it'}
        </h2>
        <button type="button" className={styles.copy} onClick={copy}>
          {copied ? 'Copied' : 'Copy letter'}
        </button>
      </div>
      <div className={styles.paper}>
        <p className={styles.subject}>
          <span className="label">Subject</span> {letter.subject}
        </p>
        <pre className={styles.body}>{letter.body}</pre>
      </div>
      <p className={styles.tip}>Fill in the [brackets]. Send it the way the contract says, and keep a copy.</p>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Letter copied to clipboard' : ''}
      </span>
    </section>
  );
}
