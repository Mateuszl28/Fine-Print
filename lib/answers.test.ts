import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyNotes, loadNotes, notesKey, progress, saveNotes } from './answers.ts';

function memory() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    size: () => m.size,
  };
}

test('each contract gets its own key, the same one every time', () => {
  assert.equal(notesKey('lease text', ['q1']), notesKey('lease text', ['q1']));
  assert.notEqual(notesKey('lease text', ['q1']), notesKey('gym text', ['q1']));
});

test('notes survive a reload; empty notes leave nothing behind', () => {
  const store = memory();
  const key = notesKey('t', ['a', 'b']);
  saveNotes(key, { answers: { 0: { done: true, note: 'Yes, in writing.' } }, extra: [{ q: 'Pets?', done: false, note: '' }] }, store);
  const back = loadNotes(key, store);
  assert.equal(back.answers[0].note, 'Yes, in writing.');
  assert.equal(back.extra[0].q, 'Pets?');
  saveNotes(key, emptyNotes(), store);
  assert.equal(store.size(), 0);
});

test('broken storage gives empty notes instead of an error', () => {
  const store = memory();
  store.setItem('k', '{not json');
  assert.deepEqual(loadNotes('k', store), emptyNotes());
  const throwing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); }, removeItem: () => {} };
  assert.deepEqual(loadNotes('k', throwing), emptyNotes());
  saveNotes('k', { answers: { 0: { done: true, note: '' } }, extra: [] }, throwing);
});

test('progress counts the report’s questions and the reader’s own', () => {
  const notes = { answers: { 0: { done: true, note: '' }, 2: { done: false, note: 'they’ll check' } }, extra: [{ q: 'Parking?', done: true, note: '' }] };
  assert.deepEqual(progress(notes, 4), { done: 2, total: 5 });
});
