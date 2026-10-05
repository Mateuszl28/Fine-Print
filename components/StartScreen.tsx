'use client';

import { useState } from 'react';
import type { ContractInput as Input } from '@/lib/api';
import type { AnalyzeError } from '@/lib/schema';
import { LANGUAGES, type Lang } from '@/lib/i18n';
import { ui } from '@/lib/ui';
import type { HistoryEntry } from '@/lib/history';
import { ContractInput } from './ContractInput';
import { SampleCards } from './SampleCards';
import { CompareSetup } from './CompareSetup';
import { RecentReads } from './RecentReads';
import styles from './StartScreen.module.css';

type Props = {
  onSubmit: (input: Input) => void;
  onError: (error: 'too_long' | 'bad_input') => void;
  initial: Input | null;
  error: AnalyzeError['error'] | null;
  onRetry?: () => void;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onCompare: (a: Input, b: Input) => void;
  history: HistoryEntry[];
  onOpenHistory: (e: HistoryEntry) => void;
  onForget: (id: string) => void;
  onForgetAll: () => void;
};

export function StartScreen(props: Props) {
  const { onSubmit, onError, initial, error, onRetry, lang, onLangChange, onCompare } = props;
  const u = ui[lang];
  const [comparing, setComparing] = useState(false);

  return (
    <main className={styles.page} lang={lang}>
      <header className={styles.masthead}>
        <span className={styles.wordmark}>Fine Print</span>
        <span className="label">{u.tagline}</span>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.headline}>
          {u.headline[0]}
          <span className="hl hl-yellow">{u.headline[1]}</span>
          {u.headline[2]}
        </h1>
        <p className={styles.lede}>
          {u.lede[0]}
          <em>{u.lede[1]}</em>
          {u.lede[2]}
        </p>
      </section>

      {error && (
        <div className={styles.error} role="alert">
          <p className={styles.errorTitle}>{u.errors[error][0]}</p>
          <p>{u.errors[error][1]}</p>
          {onRetry && error === 'failed' && (
            <button type="button" className={styles.retry} onClick={onRetry}>
              {u.tryAgain}
            </button>
          )}
        </div>
      )}

      <ContractInput onSubmit={onSubmit} onError={onError} initial={initial} lang={lang} />

      <div className={styles.langRow}>
        <label htmlFor="lang" className={styles.langLabel}>
          {u.explainIn}
        </label>
        <select
          id="lang"
          className={styles.langSelect}
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          {(Object.keys(LANGUAGES) as Lang[]).map((k) => (
            <option key={k} value={k} lang={k}>
              {LANGUAGES[k].native}
            </option>
          ))}
        </select>
        <span className={styles.langNote}>{u.anyLanguage}</span>
      </div>

      {comparing ? (
        <CompareSetup onCompare={onCompare} onError={onError} onClose={() => setComparing(false)} lang={lang} />
      ) : (
        <button type="button" className={styles.compareLink} onClick={() => setComparing(true)}>
          {u.compareLinkLead} <strong>{u.compareLink}</strong>
        </button>
      )}

      <RecentReads
        entries={props.history}
        onOpen={props.onOpenHistory}
        onForget={props.onForget}
        onForgetAll={props.onForgetAll}
        lang={lang}
      />

      <SampleCards lang={lang} onPick={(s) => onSubmit({ kind: 'text', text: s.text, label: s.label })} />

      <section className={styles.honest} aria-labelledby="honest-heading">
        <h2 id="honest-heading" className={styles.honestHeading}>
          {u.honestHeading}
        </h2>
        <ol className={styles.honestList}>
          {u.honest.map(([title, body]) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className={styles.footer}>
        <p>{u.footerPrivacy}</p>
        <p>{u.footerBest}</p>
        <p className={styles.version}>
          v{process.env.NEXT_PUBLIC_VERSION} · {process.env.NEXT_PUBLIC_BUILT} UTC
          {process.env.NEXT_PUBLIC_COMMIT && <> · {process.env.NEXT_PUBLIC_COMMIT}</>}
        </p>
      </footer>
    </main>
  );
}
