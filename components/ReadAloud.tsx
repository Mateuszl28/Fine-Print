'use client';

import { useEffect, useState } from 'react';
import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { money } from '@/lib/format';
import { topClauses } from '@/lib/topClauses';
import styles from './ReadAloud.module.css';

const voiceLang: Record<Lang, string> = { en: 'en-US', pl: 'pl-PL', uk: 'uk-UA', es: 'es-ES', de: 'de-DE' };

/** What gets read: the verdict, the real number, and the top traps. Short enough to listen to at a counter. */
export function speechFor(report: Report, lang: Lang): string {
  const t = strings[lang];
  const parts = [report.verdict];
  if (report.trueCost !== null) {
    const term = report.termMonths ? t.overMonths(report.termMonths) : t.overTerm;
    parts.push(`${t.reallyCosts}: ${money(report.trueCost, report.currency, lang)}, ${term}.`);
  }
  for (const c of topClauses(report)) parts.push(`${c.title}. ${c.whyItMatters}`);
  return parts.join(' ');
}

export function ReadAloud({ report, lang }: { report: Report; lang: Lang }) {
  const t = strings[lang];
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(speechFor(report, lang));
    u.lang = voiceLang[lang];
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    u.rate = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  return (
    <button type="button" className={styles.button} onClick={toggle} aria-pressed={speaking}>
      <span className={styles.icon} aria-hidden="true">
        {speaking ? '■' : '▶'}
      </span>
      {speaking ? t.stopReading : t.readAloud}
    </button>
  );
}
