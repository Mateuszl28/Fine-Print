'use client';

import { useRef, useState } from 'react';
import type { ContractInput } from '@/lib/api';
import { prepareFiles } from '@/lib/prepareFiles';
import { phonePlanB, samples } from '@/lib/samples';
import styles from './CompareSetup.module.css';

type Slot = ContractInput | null;

type Props = {
  onCompare: (a: ContractInput, b: ContractInput) => void;
  onError: (error: 'too_long' | 'bad_input') => void;
  onClose: () => void;
};

const MIN_CHARS = 200;

function describe(slot: Slot) {
  if (!slot) return null;
  if (slot.kind === 'text') return slot.label ?? `Pasted text · ${slot.text.length.toLocaleString('en-US')} characters`;
  return slot.files.length === 1 && slot.files[0].mediaType === 'application/pdf'
    ? `PDF · ${slot.files[0].name}`
    : `${slot.files.length} photo${slot.files.length === 1 ? '' : 's'}`;
}

function SlotPicker({ name, slot, onChange, onError }: {
  name: string;
  slot: Slot;
  onChange: (s: Slot) => void;
  onError: Props['onError'];
}) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const ready = describe(slot);

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
            Change
          </button>
        </div>
      ) : (
        <>
          <button type="button" className={styles.upload} onClick={() => fileRef.current?.click()}>
            Photo or PDF
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
            placeholder="…or paste the text"
            rows={4}
            aria-label={`${name}: paste the contract text`}
          />
          <button
            type="button"
            className={styles.link}
            disabled={text.trim().length < MIN_CHARS}
            onClick={() => onChange({ kind: 'text', text })}
          >
            Use this text
          </button>
        </>
      )}
    </div>
  );
}

export function CompareSetup({ onCompare, onError, onClose }: Props) {
  const [a, setA] = useState<Slot>(null);
  const [b, setB] = useState<Slot>(null);
  const phoneA = samples.find((s) => s.id === 'phone')!;

  return (
    <section className={styles.box} aria-labelledby="compare-heading">
      <div className={styles.head}>
        <h2 id="compare-heading" className={styles.heading}>
          Compare two offers
        </h2>
        <button type="button" className={styles.link} onClick={onClose}>
          Close
        </button>
      </div>
      <p className={styles.lede}>Two gyms, two phone plans, two flats. The cheaper sticker isn&rsquo;t always the cheaper deal.</p>

      <div className={styles.slots}>
        <SlotPicker name="Offer A" slot={a} onChange={setA} onError={onError} />
        <SlotPicker name="Offer B" slot={b} onChange={setB} onError={onError} />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} disabled={!a || !b} onClick={() => a && b && onCompare(a, b)}>
          Compare them
        </button>
        <button
          type="button"
          className={styles.link}
          onClick={() =>
            onCompare(
              { kind: 'text', text: phoneA.text, label: 'Nimbus Mobile' },
              { kind: 'text', text: phonePlanB.text, label: 'Orbit Wireless' },
            )
          }
        >
          Or try it with two phone plans &rarr;
        </button>
      </div>
    </section>
  );
}
