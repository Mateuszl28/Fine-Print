'use client';

import { useRef, useState } from 'react';
import type { ContractInput } from '@/lib/api';
import { prepareFiles } from '@/lib/prepareFiles';
import { phonePlanB, samples } from '@/lib/samples';
import type { Lang } from '@/lib/i18n';
import { ui } from '@/lib/ui';
import styles from './CompareSetup.module.css';

type Slot = ContractInput | null;

type Props = {
  onCompare: (a: ContractInput, b: ContractInput) => void;
  onError: (error: 'too_long' | 'bad_input') => void;
  onClose: () => void;
  lang: Lang;
};

const MIN_CHARS = 200;

function describe(slot: Slot, lang: Lang) {
  if (!slot) return null;
  const u = ui[lang];
  if (slot.kind === 'text') return slot.label ?? u.pastedText(slot.text.length);
  return slot.files.length === 1 && slot.files[0].mediaType === 'application/pdf'
    ? `PDF · ${slot.files[0].name}`
    : u.photos(slot.files.length);
}

function SlotPicker({ name, slot, onChange, onError, lang }: {
  name: string;
  slot: Slot;
  onChange: (s: Slot) => void;
  onError: Props['onError'];
  lang: Lang;
}) {
  const u = ui[lang];
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const ready = describe(slot, lang);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const result = await prepareFiles(list);
    if (fileRef.current) fileRef.current.value = '';
    if (result.ok) onChange({ kind: 'files', files: result.files });
    else onError(result.error);
  }

  return (
    <div className={styles.slot}>
      <p className={styles.slotName}>{name}</p>
      {ready ? (
        <div className={styles.ready}>
          <span className="hl hl-green">{ready}</span>
          <button type="button" className={styles.link} onClick={() => onChange(null)}>
            {u.change}
          </button>
        </div>
      ) : (
        <>
          <button type="button" className={styles.upload} onClick={() => fileRef.current?.click()}>
            {u.photoOrPdf}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={u.orPaste}
            rows={4}
            aria-label={`${name}: paste the contract text`}
          />
          <button
            type="button"
            className={styles.link}
            disabled={text.trim().length < MIN_CHARS}
            onClick={() => onChange({ kind: 'text', text })}
          >
            {u.useText}
          </button>
        </>
      )}
    </div>
  );
}

export function CompareSetup({ onCompare, onError, onClose, lang }: Props) {
  const u = ui[lang];
  const [a, setA] = useState<Slot>(null);
  const [b, setB] = useState<Slot>(null);
  const phoneA = samples.find((s) => s.id === 'phone')!;

  return (
    <section className={styles.box} aria-labelledby="compare-heading">
      <div className={styles.head}>
        <h2 id="compare-heading" className={styles.heading}>
          {u.compareHeading}
        </h2>
        <button type="button" className={styles.link} onClick={onClose}>
          {u.close}
        </button>
      </div>
      <p className={styles.lede}>{u.compareLede}</p>

      <div className={styles.slots}>
        <SlotPicker name={u.offerA} slot={a} onChange={setA} onError={onError} lang={lang} />
        <SlotPicker name={u.offerB} slot={b} onChange={setB} onError={onError} lang={lang} />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={!a || !b} onClick={() => a && b && onCompare(a, b)}>
          {u.compareGo}
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={() =>
            onCompare(
              { kind: 'text', text: phoneA.text, label: 'Nimbus Mobile', sampleId: phoneA.id },
              { kind: 'text', text: phonePlanB.text, label: 'Orbit Wireless', sampleId: phonePlanB.id },
            )
          }
        >
          {u.compareDemo}
        </button>
      </div>
    </section>
  );
}
