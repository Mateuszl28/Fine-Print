import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cacheKey, createCache } from './resultCache.ts';

test('returns what was stored until it expires', () => {
  const c = createCache<string>(10, 1000);
  c.set('a', 'report', 0);
  assert.equal(c.get('a', 500), 'report');
  assert.equal(c.get('a', 1001), undefined);
});

test('drops the least recently used entry when full', () => {
  const c = createCache<number>(2, 60_000);
  c.set('a', 1, 0);
  c.set('b', 2, 0);
  c.get('a', 1); // a is now the most recent
  c.set('c', 3, 2);
  assert.equal(c.get('b', 3), undefined);
  assert.equal(c.get('a', 3), 1);
  assert.equal(c.get('c', 3), 3);
});

test('keys differ by language and text', () => {
  assert.notEqual(cacheKey('en', 'contract'), cacheKey('pl', 'contract'));
  assert.notEqual(cacheKey('en', 'contract'), cacheKey('en', 'contract.'));
  assert.equal(cacheKey('en', 'contract'), cacheKey('en', 'contract'));
});
