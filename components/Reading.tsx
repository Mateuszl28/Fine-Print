'use client';

import { useEffect, useState } from 'react';
import styles from './Reading.module.css';

const LINES = [
  'Reading the small print…',
  'Looking for the auto-renewal…',
  'Finding out how hard it is to leave…',
  'Checking which fees are “non-refundable”…',
  'Adding up what it really costs…',
  'Writing your letter…',
];

export function Reading({ onCancel, fromPhoto }: { onCancel: () => void; fromPhoto?: boolean }) {
  const lines = fromPhoto ? ['Typing up your photo…', ...LINES] : LINES;
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 2600);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <main className={styles.page} aria-busy="true">
      <div className={styles.sheet} aria-hidden="true">
        {Array.from({ length: 9 }, (_, n) => (
          <span key={n} className={styles.line} style={{ width: `${[92, 100, 76, 98, 64, 100, 88, 95, 52][n]}%` }} />
        ))}
        <span className={styles.marker} />
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {lines[i]}
      </p>
      <p className={styles.sub}>Usually 20–40 seconds. Longer contracts take longer, which is sort of the point.</p>
      <button type="button" className={styles.cancel} onClick={onCancel}>
        Cancel
      </button>
    </main>
  );
}
