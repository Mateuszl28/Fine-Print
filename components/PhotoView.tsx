'use client';

import type { LocatedClause } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import styles from './PhotoView.module.css';

type Props = {
  photos: { mediaType: string; data: string }[];
  clauses: LocatedClause[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  lang: Lang;
  status: 'idle' | 'working' | 'done' | 'failed';
};

/** The person's own photo, with each clause's box drawn over it in its highlighter colour. */
export function PhotoView({ photos, clauses, selectedId, onSelect, lang, status }: Props) {
  const t = strings[lang];
  const name = { red: t.tagRed, yellow: t.tagYellow, green: t.tagGreen };
  const missing = clauses.filter((c) => c.boxes.length === 0).length;
  return (
    <div className={styles.wrap} aria-busy={status === 'working'}>
      {status === 'working' && (
        <p className={styles.working} role="status">
          {t.photoWorking}
        </p>
      )}
      {photos.map((p, index) => (
        <figure key={index} className={styles.photo}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing to optimise */}
          <img src={`data:${p.mediaType};base64,${p.data}`} alt="" className={styles.img} />
          {clauses.flatMap((c) =>
            c.boxes
              .filter((b) => b.image === index)
              .map((b, k) => {
                const [y0, x0, y1, x1] = b.box;
                return (
                  <button
                    key={`${c.id}-${k}`}
                    type="button"
                    className={`${styles.box} ${styles[c.severity]} ${selectedId === c.id ? styles.selected : ''}`}
                    style={{ top: `${y0 / 10}%`, left: `${x0 / 10}%`, height: `${(y1 - y0) / 10}%`, width: `${(x1 - x0) / 10}%` }}
                    aria-label={`${name[c.severity]}: ${c.title}`}
                    aria-pressed={selectedId === c.id}
                    onClick={() => onSelect(c.id)}
                  />
                );
              }),
          )}
        </figure>
      ))}
      {status === 'done' && (
        <p className={styles.note}>
          {t.photoNote}
          {missing > 0 && <> {t.photoMissing(missing)}</>}
        </p>
      )}
      {status === 'failed' && <p className={styles.note}>{t.photoFailed}</p>}
    </div>
  );
}
