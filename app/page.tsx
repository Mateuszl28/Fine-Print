'use client';

import { useEffect, useRef, useState } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { Reading } from '@/components/Reading';
import { ReportView } from '@/components/Report';
import { CompareView } from '@/components/CompareView';
import { analyzeContract, type ContractInput } from '@/lib/api';
import { isLang, type Lang } from '@/lib/i18n';
import type { AnalyzeError, Report } from '@/lib/schema';

type View =
  | { name: 'start' }
  | { name: 'reading' }
  | { name: 'report'; report: Report; lang: Lang; fromCompare?: boolean }
  | { name: 'compare'; reports: [Report, Report]; lang: Lang }
  | { name: 'error'; error: AnalyzeError['error'] };

const LANG_KEY = 'fineprint.lang';

export default function Home() {
  const [view, setView] = useState<View>({ name: 'start' });
  const [lastInput, setLastInput] = useState<ContractInput | null>(null);
  const [comparison, setComparison] = useState<{ reports: [Report, Report]; lang: Lang } | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const abortRef = useRef<AbortController | null>(null);

  // Remember the reader's language; first visit follows the browser.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {}
    const guess = navigator.language.slice(0, 2);
    if (isLang(saved)) setLang(saved);
    else if (isLang(guess)) setLang(guess);
  }, []);

  function changeLang(next: Lang) {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {}
  }

  async function run(input: ContractInput) {
    setLastInput(input);
    setView({ name: 'reading' });
    window.scrollTo({ top: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await analyzeContract(input, lang, controller.signal);
      setView(
        result.ok ? { name: 'report', report: result.report, lang } : { name: 'error', error: result.error },
      );
    } catch {
      // aborted by the user; they're already back on the start screen
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  async function runCompare(a: ContractInput, b: ContractInput) {
    setLastInput(null);
    setView({ name: 'reading' });
    window.scrollTo({ top: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const [ra, rb] = await Promise.all([
        analyzeContract(a, lang, controller.signal),
        analyzeContract(b, lang, controller.signal),
      ]);
      if (!ra.ok) return setView({ name: 'error', error: ra.error });
      if (!rb.ok) return setView({ name: 'error', error: rb.error });
      const result = { reports: [ra.report, rb.report] as [Report, Report], lang };
      setComparison(result);
      setView({ name: 'compare', ...result });
    } catch {
      // aborted
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setView({ name: 'start' });
  }

  function startOver() {
    setLastInput(null);
    setComparison(null);
    setView({ name: 'start' });
    window.scrollTo({ top: 0 });
  }

  if (view.name === 'reading') return <Reading onCancel={cancel} fromPhoto={lastInput?.kind === 'files'} />;
  if (view.name === 'compare')
    return (
      <CompareView
        reports={view.reports}
        lang={view.lang}
        onStartOver={startOver}
        onOpen={(i) => {
          setView({ name: 'report', report: view.reports[i], lang: view.lang, fromCompare: true });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  if (view.name === 'report')
    return (
      <ReportView
        report={view.report}
        lang={view.lang}
        onStartOver={startOver}
        onBackToCompare={
          view.fromCompare && comparison
            ? () => {
                setView({ name: 'compare', ...comparison });
                window.scrollTo({ top: 0 });
              }
            : undefined
        }
      />
    );

  return (
    <StartScreen
      onSubmit={run}
      onError={(error) => setView({ name: 'error', error })}
      initial={lastInput}
      error={view.name === 'error' ? view.error : null}
      onRetry={lastInput ? () => run(lastInput) : undefined}
      lang={lang}
      onLangChange={changeLang}
      onCompare={runCompare}
    />
  );
}
