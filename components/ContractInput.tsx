'use client';

import { useRef, useState } from 'react';
import type { ContractInput as Input } from '@/lib/api';
import { prepareFiles } from '@/lib/prepareFiles';
import styles from './ContractInput.module.css';

const MIN_CHARS = 200;

type Props = {
  onSubmit: (input: Input) => void;
  onError: (error: 'too_long' | 'bad_input') => void;
  initial: Input | null;
};

export function ContractInput({ onSubmit, onError, initial }: Props) {
  const initialText = initial?.kind === 'text' && !initial.label ? initial.text : '';
  const [pasting, setPasting] = useState(initialText.length > 0);
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const tooShort = text.trim().length < MIN_CHARS;

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    const result = await prepareFiles(list);
    setBusy(false);
    if (cameraRef.current) cameraRef.current.value = '';
    if (uploadRef.current) uploadRef.current.value = '';
    if (result.ok) onSubmit({ kind: 'files', files: result.files });
    else onError(result.error);
  }

  return (
    <section className={styles.box} aria-label="Your contract">
      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={busy} onClick={() => cameraRef.current?.click()}>
          {busy ? 'Getting the photo ready…' : 'Scan a contract'}
        </button>
        <button type="button" className={styles.secondary} disabled={busy} onClick={() => uploadRef.current?.click()}>
          Upload a PDF or photos
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={uploadRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <p className={styles.small}>Up to 4 photos, or one PDF. Flat, in good light, every page with numbers on it.</p>

      {!pasting ? (
        <button type="button" className={styles.link} onClick={() => setPasting(true)}>
          Or paste the text instead
        </button>
      ) : (
        <div className={styles.pasteArea}>
          <label htmlFor="contract-text" className="label">
            Paste the contract
          </label>
          <textarea
            id="contract-text"
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the whole thing. Terms, fees, the bit in grey at the bottom."
            rows={7}
            autoFocus={!initialText}
          />
          <div className={styles.row}>
            <span className={styles.hint}>
              {tooShort && text.length > 0 ? 'Keep going — that looks shorter than a contract.' : ' '}
            </span>
            <button
              type="button"
              className={styles.primary}
              disabled={tooShort}
              onClick={() => onSubmit({ kind: 'text', text })}
            >
              Read it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
