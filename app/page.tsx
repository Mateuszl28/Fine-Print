'use client';

import { useRef, useState } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { Reading } from '@/components/Reading';
import { ReportView } from '@/components/Report';
import { analyzeContract, type ContractInput } from '@/lib/api';
import type { AnalyzeError, Report } from '@/lib/schema';

type View =
  | { name: 'start' }
  | { name: 'reading' }
  | { name: 'report'; report: Report }
  | { name: 'error'; error: AnalyzeError['error'] };

export default function Home() {
  const [view, setView] = useState<View>({ name: 'start' });
  const [lastInput, setLastInput] = useState<ContractInput | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run(input: ContractInput) {
    setLastInput(input);
    setView({ name: 'reading' });
    window.scrollTo({ top: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await analyzeContract(input, controller.signal);
      setView(result.ok ? { name: 'report', report: result.report } : { name: 'error', error: result.error });
    } catch {
      // aborted by the user; they're already back on the start screen
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
    setView({ name: 'start' });
    window.scrollTo({ top: 0 });
  }

  if (view.name === 'reading') return <Reading onCancel={cancel} fromPhoto={lastInput?.kind === 'files'} />;
  if (view.name === 'report') return <ReportView report={view.report} onStartOver={startOver} />;

  return (
    <StartScreen
      onSubmit={run}
      onError={(error) => setView({ name: 'error', error })}
      initial={lastInput}
      error={view.name === 'error' ? view.error : null}
      onRetry={lastInput ? () => run(lastInput) : undefined}
    />
  );
}
