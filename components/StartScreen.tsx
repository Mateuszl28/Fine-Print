'use client';

import type { ContractInput as Input } from '@/lib/api';
import type { AnalyzeError } from '@/lib/schema';
import { ContractInput } from './ContractInput';
import { SampleCards } from './SampleCards';
import styles from './StartScreen.module.css';

const errorCopy: Record<AnalyzeError['error'], { title: string; body: string }> = {
  not_a_contract: {
    title: "I couldn't read a contract here.",
    body: 'Try a sharper photo in good light, flat on a table. Or paste the text.',
  },
  too_long: {
    title: 'That one is too long for me.',
    body: 'Up to 4 photos or a PDF of about 10 pages. Try just the pages with the terms and fees.',
  },
  bad_input: {
    title: "I can't open that file.",
    body: 'Photos (JPG, PNG) and PDFs work. Or paste the text.',
  },
  failed: {
    title: 'Something went wrong on our side.',
    body: 'Nothing you did. Give it another go.',
  },
};

type Props = {
  onSubmit: (input: Input) => void;
  onError: (error: 'too_long' | 'bad_input') => void;
  initial: Input | null;
  error: AnalyzeError['error'] | null;
  onRetry?: () => void;
};

export function StartScreen({ onSubmit, onError, initial, error, onRetry }: Props) {
  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.wordmark}>Fine Print</span>
        <span className="label">Read it before you sign it</span>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.headline}>
          The <span className="hl hl-yellow">small print</span>, read out loud.
        </h1>
        <p className={styles.lede}>
          Snap the contract you&rsquo;re about to sign. Fine Print marks the traps on the page, adds up what it will{' '}
          <em>really</em> cost, and writes the letter you&rsquo;ll need to get out of it.
        </p>
      </section>

      {error && (
        <div className={styles.error} role="alert">
          <p className={styles.errorTitle}>{errorCopy[error].title}</p>
          <p>{errorCopy[error].body}</p>
          {onRetry && error === 'failed' && (
            <button type="button" className={styles.retry} onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      )}

      <ContractInput onSubmit={onSubmit} onError={onError} initial={initial} />

      <SampleCards onPick={(s) => onSubmit({ kind: 'text', text: s.text, label: s.label })} />

      <footer className={styles.footer}>
        <p>Not legal advice. Nothing you upload is stored.</p>
        <p>Gym memberships, leases, phone plans and pay-over-time loans read best.</p>
      </footer>
    </main>
  );
}
