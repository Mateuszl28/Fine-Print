'use client';

import { useState } from 'react';
import type { ContractInput as Input } from '@/lib/api';
import type { AnalyzeError } from '@/lib/schema';
import { LANGUAGES, type Lang } from '@/lib/i18n';
import { ContractInput } from './ContractInput';
import { SampleCards } from './SampleCards';
import { CompareSetup } from './CompareSetup';
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
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onCompare: (a: Input, b: Input) => void;
};

export function StartScreen({ onSubmit, onError, initial, error, onRetry, lang, onLangChange, onCompare }: Props) {
  const [comparing, setComparing] = useState(false);
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

      <div className={styles.langRow}>
        <label htmlFor="lang" className={styles.langLabel}>
          Explain it to me in
        </label>
        <select
          id="lang"
          className={styles.langSelect}
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          {(Object.keys(LANGUAGES) as Lang[]).map((k) => (
            <option key={k} value={k}>
              {LANGUAGES[k].native}
            </option>
          ))}
        </select>
        <span className={styles.langNote}>The contract can be in any language.</span>
      </div>

      {comparing ? (
        <CompareSetup onCompare={onCompare} onError={onError} onClose={() => setComparing(false)} />
      ) : (
        <button type="button" className={styles.compareLink} onClick={() => setComparing(true)}>
          Choosing between two offers? <strong>Compare them side by side &rarr;</strong>
        </button>
      )}

      <SampleCards onPick={(s) => onSubmit({ kind: 'text', text: s.text, label: s.label })} />

      <footer className={styles.footer}>
        <p>Not legal advice. Nothing you upload is stored.</p>
        <p>Gym memberships, leases, phone plans and pay-over-time loans read best.</p>
      </footer>
    </main>
  );
}
