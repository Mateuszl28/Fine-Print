'use client';

import type { LocatedClause } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import styles from './ClauseNote.module.css';

type Props = { clause: LocatedClause; lang: Lang; onClose?: () => void };

export function ClauseNote({ clause, lang, onClose }: Props) {
  const t = strings[lang];
  const tag = { red: t.tagRed, yellow: t.tagYellow, green: t.tagGreen }[clause.severity];
  return (
    <div className={styles.note} data-severity={clause.severity}>
      <div className={styles.head}>
        <span className={`hl hl-${clause.severity} ${styles.tag}`}>{tag}</span>
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose}>
            {t.close}
          </button>
        )}
      </div>
      <h3 className={styles.title}>{clause.title}</h3>
      <p className={styles.meaning}>{clause.meaning}</p>
      <dl className={styles.list}>
        <dt className="label">{t.whyItMatters}</dt>
        <dd>{clause.whyItMatters}</dd>
        <dt className="label">{t.whatToDo}</dt>
        <dd>{clause.whatToDo}</dd>
      </dl>
    </div>
  );
}
