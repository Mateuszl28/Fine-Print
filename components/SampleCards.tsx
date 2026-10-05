'use client';

import { samples, type Sample } from '@/lib/samples';
import styles from './SampleCards.module.css';

export function SampleCards({ onPick }: { onPick: (s: Sample) => void }) {
  return (
    <section className={styles.wrap} aria-labelledby="samples-heading">
      <h2 id="samples-heading" className="label">
        No contract handy? Read one of ours
      </h2>
      <ul className={styles.grid}>
        {samples.map((s, i) => (
          <li key={s.id} style={{ ['--tilt' as string]: `${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg` }}>
            <button type="button" className={styles.card} onClick={() => onPick(s)}>
              <span className={styles.title}>{s.label}</span>
              <span className={styles.blurb}>{s.blurb}</span>
              <span className={styles.lines} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className={styles.go}>Read this one &rarr;</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>Made-up companies, real tricks.</p>
    </section>
  );
}
