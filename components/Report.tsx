'use client';

import { useEffect, useState } from 'react';
import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { HighlightedDoc } from './HighlightedDoc';
import { ClauseNote } from './ClauseNote';
import { VerdictStrip } from './VerdictStrip';
import { AskList } from './AskList';
import { Letter } from './Letter';
import { Reminder } from './Reminder';
import { TopThree } from './TopThree';
import { ReadAloud } from './ReadAloud';
import { ShareButton } from './ShareButton';
import { PhotoView } from './PhotoView';
import styles from './Report.module.css';

type Props = {
  report: Report;
  lang: Lang;
  onStartOver: () => void;
  onBackToCompare?: () => void;
  shared?: boolean;
  saved?: boolean;
  /** The photos this report was made from, if any (kept in memory only, never shared or saved). */
  photos?: { mediaType: string; data: string }[];
};

export function ReportView({ report, lang, onStartOver, onBackToCompare, shared, saved, photos }: Props) {
  const t = strings[lang];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canShowPhoto = Boolean(photos?.length) && report.clauses.some((c) => c.boxes.length > 0);
  const [onPhoto, setOnPhoto] = useState(false);
  const selected = report.clauses.find((c) => c.id === selectedId) ?? null;
  const count = (s: 'red' | 'yellow' | 'green') => report.clauses.filter((c) => c.severity === s).length;

  function jumpTo(id: string) {
    setSelectedId(id);
    document.getElementById(`clause-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Escape closes the note (and the bottom sheet on phones).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className={styles.page} lang={lang}>
      <nav className={styles.bar}>
        <button type="button" className={styles.back} onClick={onBackToCompare ?? onStartOver}>
          {onBackToCompare ? t.backToCompare : t.scanAnother}
        </button>
        <span className={styles.wordmark}>Fine Print</span>
      </nav>

      {shared && <p className={styles.banner}>{t.sharedBanner}</p>}

      <header className={styles.header}>
        <div>
          <p className="label">{report.title}</p>
          <ul className={styles.legend}>
            <li>
              <span className="hl hl-red">{t.traps(count('red'))}</span>
            </li>
            <li>
              <span className="hl hl-yellow">{t.watchOuts(count('yellow'))}</span>
            </li>
            <li>
              <span className="hl hl-green">{t.fair(count('green'))}</span>
            </li>
          </ul>
        </div>
        <div className={styles.actions}>
          <ShareButton report={report} lang={lang} />
          <button type="button" className={styles.save} onClick={() => window.print()}>
            {t.save}
          </button>
        </div>
      </header>

      <VerdictStrip report={report} lang={lang} onJump={jumpTo}>
        <ReadAloud report={report} lang={lang} />
      </VerdictStrip>

      <TopThree report={report} lang={lang} onJump={jumpTo} />

      <div className={styles.grid}>
        <div className={styles.docCol}>
          <div className={styles.docHead}>
            <p className={styles.tapHint}>{t.tapHint}</p>
            {canShowPhoto && (
              <div className={styles.toggle} role="group">
                <button type="button" aria-pressed={!onPhoto} onClick={() => setOnPhoto(false)}>
                  {t.viewText}
                </button>
                <button type="button" aria-pressed={onPhoto} onClick={() => setOnPhoto(true)}>
                  {t.viewPhoto}
                </button>
              </div>
            )}
          </div>
          {canShowPhoto && onPhoto ? (
            <PhotoView
              photos={photos!}
              clauses={report.clauses}
              selectedId={selectedId}
              onSelect={setSelectedId}
              lang={lang}
            />
          ) : (
            <HighlightedDoc
              text={report.text}
              clauses={report.clauses}
              selectedId={selectedId}
              onSelect={setSelectedId}
              lang={lang}
            />
          )}

          {/* On paper there's nothing to tap, so print every note after the contract. */}
          <section className={styles.printNotes} aria-hidden="true">
            <h2>{t.notesHeading}</h2>
            {report.clauses.map((c) => (
              <ClauseNote key={c.id} clause={c} lang={lang} />
            ))}
          </section>

          <AskList questions={report.questions} title={t.ask} />
          <Reminder report={report} lang={lang} />
          <Letter letter={report.letter} lang={lang} />
        </div>

        <aside className={styles.panel}>
          <div className={styles.panelInner}>
            {selected ? (
              <ClauseNote clause={selected} lang={lang} onClose={() => setSelectedId(null)} />
            ) : (
              <p className={styles.panelEmpty}>{t.pickHint}</p>
            )}
          </div>
        </aside>
      </div>

      {selected && (
        <div className={styles.sheetWrap} role="dialog" aria-modal="false" aria-label={selected.title}>
          <button type="button" className={styles.scrim} aria-label={t.close} onClick={() => setSelectedId(null)} />
          <div className={styles.sheet}>
            <span className={styles.grabber} aria-hidden="true" />
            <ClauseNote clause={selected} lang={lang} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        {t.footer}
        {saved && <> {t.savedHere}</>}
      </footer>
    </main>
  );
}
