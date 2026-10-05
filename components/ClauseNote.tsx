'use client';

import type { LocatedClause } from '@/lib/schema';
import styles from './ClauseNote.module.css';

const tag = { red: 'Trap', yellow: 'Watch out', green: 'In your favour' } as const;

export function ClauseNote({ clause, onClose }: { clause: LocatedClause; onClose?: () => void }) {
  return (
    <div className={styles.note} data-severity={clause.severity}>
      <div className={styles.head}>
        <span className={`hl hl-${clause.severity} ${styles.tag}`}>{tag[clause.severity]}</span>
        {onClose && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close note">
            Close
          </button>
        )}
      </div>
      <h3 className={styles.title}>{clause.title}</h3>
      <p className={styles.meaning}>{clause.meaning}</p>
      <dl className={styles.list}>
        <dt className="label">Why it matters</dt>
        <dd>{clause.whyItMatters}</dd>
        <dt className="label">What to do</dt>
        <dd>{clause.whatToDo}</dd>
      </dl>
    </div>
  );
}
