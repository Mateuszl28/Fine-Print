'use client';

import { samples, type Sample } from '@/lib/samples';
import type { Lang } from '@/lib/i18n';
import { ui } from '@/lib/ui';
import styles from './SampleCards.module.css';

export function SampleCards({ onPick, lang }: { onPick: (s: Sample) => void; lang: Lang }) {
  const u = ui[lang];
  return (
    <section className={styles.wrap} aria-labelledby="samples-heading">
      <h2 id="samples-heading" className="label">
        {u.samplesHeading}
      </h2>
      <ul className={styles.grid}>
        {samples.map((s, i) => (
          <li key={s.id} style={{ ['--tilt' as string]: `${[-0.8, 0.6, -0.4, 0.9, -0.6][i % 5]}deg` }}>
            <button type="button" className={styles.card} onClick={() => onPick(s)}>
              <span className={styles.title}>{u.sampleBlurbs[s.id]?.[0] ?? s.label}</span>
              <span className={styles.blurb}>{u.sampleBlurbs[s.id]?.[1] ?? s.blurb}</span>
              <span className={styles.lines} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span className={styles.go}>{u.readThis}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{u.samplesNote}</p>
    </section>
  );
}
