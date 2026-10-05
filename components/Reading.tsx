'use client';

import { useEffect, useState } from 'react';
import type { Lang } from '@/lib/i18n';
import { ui } from '@/lib/ui';
import styles from './Reading.module.css';

export function Reading({ onCancel, fromPhoto, lang }: { onCancel: () => void; fromPhoto?: boolean; lang: Lang }) {
  const u = ui[lang];
  const lines = fromPhoto ? [u.readingPhoto, ...u.reading] : u.reading;
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 2600);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <main className={styles.page} aria-busy="true" lang={lang}>
      <div className={styles.sheet} aria-hidden="true">
        {Array.from({ length: 9 }, (_, n) => (
          <span key={n} className={styles.line} style={{ width: `${[92, 100, 76, 98, 64, 100, 88, 95, 52][n]}%` }} />
        ))}
        <span className={styles.marker} />
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {lines[i]}
      </p>
      <p className={styles.sub}>{u.readingSub}</p>
      <button type="button" className={styles.cancel} onClick={onCancel}>
        {u.cancel}
      </button>
    </main>
  );
}
