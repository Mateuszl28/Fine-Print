'use client';

import { useEffect, useState } from 'react';
import type { Report } from '@/lib/schema';
import { HighlightedDoc } from './HighlightedDoc';
import { ClauseNote } from './ClauseNote';
import { VerdictStrip } from './VerdictStrip';
import { AskList } from './AskList';
import { Letter } from './Letter';
import styles from './Report.module.css';

type Props = { report: Report; onStartOver: () => void };

export function ReportView({ report, onStartOver }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    <main className={styles.page}>
      <nav className={styles.bar}>
        <button type="button" className={styles.back} onClick={onStartOver}>
          &larr; Scan another
        </button>
        <span className={styles.wordmark}>Fine Print</span>
      </nav>

      <header className={styles.header}>
        <p className="label">{report.title}</p>
        <ul className={styles.legend}>
          <li>
            <span className="hl hl-red">{count('red')} traps</span>
          </li>
          <li>
            <span className="hl hl-yellow">{count('yellow')} watch-outs</span>
          </li>
          <li>
            <span className="hl hl-green">{count('green')} fair</span>
          </li>
        </ul>
      </header>

      <VerdictStrip report={report} onJump={jumpTo} />

      <div className={styles.grid}>
        <div className={styles.docCol}>
          <p className={styles.tapHint}>Tap anything highlighted.</p>
          <HighlightedDoc
            text={report.text}
            clauses={report.clauses}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <AskList questions={report.questions} />
          <Letter letter={report.letter} />
        </div>

        <aside className={styles.panel}>
          <div className={styles.panelInner}>
            {selected ? (
              <div className={styles.desktopNote}>
                <ClauseNote clause={selected} onClose={() => setSelectedId(null)} />
              </div>
            ) : (
              <p className={styles.panelEmpty}>Pick a highlight on the page to see what it means for you.</p>
            )}
          </div>
        </aside>
      </div>

      {selected && (
        <div className={styles.sheetWrap} role="dialog" aria-modal="false" aria-label={selected.title}>
          <button type="button" className={styles.scrim} aria-label="Close note" onClick={() => setSelectedId(null)} />
          <div className={styles.sheet}>
            <span className={styles.grabber} aria-hidden="true" />
            <ClauseNote clause={selected} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}

      <footer className={styles.footer}>Not legal advice. This report isn&rsquo;t saved anywhere — close the tab and it&rsquo;s gone.</footer>
    </main>
  );
}
