'use client';

import { Fragment, useEffect, useState } from 'react';
import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { HighlightedDoc } from './HighlightedDoc';
import { ClauseNote } from './ClauseNote';
import { VerdictStrip } from './VerdictStrip';
import { AskList } from './AskList';
import { Letter } from './Letter';
import { Reminder } from './Reminder';
import { ExitCost } from './ExitCost';
import { MonthByMonth } from './MonthByMonth';
import { Checks } from './Checks';
import { TopThree } from './TopThree';
import { ReadAloud } from './ReadAloud';
import { ShareButton } from './ShareButton';
import { PhotoView } from './PhotoView';
import type { PhotoBox } from '@/lib/schema';
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
  const canShowPhoto = Boolean(photos?.length);
  const [onPhoto, setOnPhoto] = useState(false);
  const [placed, setPlaced] = useState<Map<string, PhotoBox[]> | null>(null);
  const [ocr, setOcr] = useState<'idle' | 'working' | 'done' | 'failed'>('idle');

  // Read the photo only when someone asks for the photo view: it's a few MB of OCR data.
  function showPhoto() {
    setOnPhoto(true);
    if (ocr !== 'idle' || !photos) return;
    setOcr('working');
    import('@/lib/ocr')
      .then(({ placeOnPhotos }) => placeOnPhotos(photos, report.clauses, report.text))
      .then((map) => {
        setPlaced(map);
        setOcr(map.size > 0 ? 'done' : 'failed');
      })
      .catch((err) => {
        console.error('[photo] OCR failed', err);
        setOcr('failed');
      });
  }

  const photoClauses = report.clauses.map((c) => ({ ...c, boxes: placed?.get(c.id) ?? [] }));
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
            <p className={styles.tapHint}>
              {t.tapHint}
              {!onPhoto && report.terms?.length ? ` ${t.termsHint}` : ''}
            </p>
            {canShowPhoto && (
              <div className={styles.toggle} role="group">
                <button type="button" aria-pressed={!onPhoto} onClick={() => setOnPhoto(false)}>
                  {t.viewText}
                </button>
                <button type="button" aria-pressed={onPhoto} onClick={showPhoto}>
                  {t.viewPhoto}
                </button>
              </div>
            )}
          </div>
          {canShowPhoto && onPhoto ? (
            <PhotoView
              photos={photos!}
              clauses={photoClauses}
              status={ocr}
              selectedId={selectedId}
              onSelect={setSelectedId}
              lang={lang}
            />
          ) : (
            <HighlightedDoc
              text={report.text}
              clauses={report.clauses}
              terms={report.terms}
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
            {report.terms && report.terms.length > 0 && (
              <>
                <h2>{t.termsHeading}</h2>
                <dl className={styles.printTerms}>
                  {report.terms.map((term) => (
                    <Fragment key={term.start}>
                      <dt>{term.term}</dt>
                      <dd>{term.plain}</dd>
                    </Fragment>
                  ))}
                </dl>
              </>
            )}
          </section>

          <AskList questions={report.questions} text={report.text} lang={lang} />
          {report.earlyExit ? (
            <ExitCost report={report} lang={lang} onJump={jumpTo} />
          ) : (
            <MonthByMonth report={report} lang={lang} />
          )}
          <Reminder report={report} lang={lang} />
          <Letter report={report} lang={lang} />
          <Checks report={report} lang={lang} />
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
