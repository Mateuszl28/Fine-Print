'use client';

import { useState } from 'react';
import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { encodeShare } from '@/lib/share';
import styles from './ShareButton.module.css';

export function ShareButton({ report, lang }: { report: Report; lang: Lang }) {
  const t = strings[lang];
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}/#${await encodeShare(report, lang)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Fine Print · ${report.title}`, text: report.verdict, url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return; // the person closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(t.share, url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.button} onClick={share} title={t.shareNote}>
        {copied ? t.linkCopied : t.share}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? t.linkCopied : ''}
      </span>
    </div>
  );
}
