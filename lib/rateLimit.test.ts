import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientKey, createLimiter } from './rateLimit.ts';

test('allows up to the limit, then blocks until the window passes', () => {
  const limit = createLimiter(3, 60_000);
  const t0 = 1_000_000;
  assert.equal(limit('a', t0).ok, true);
  assert.equal(limit('a', t0 + 1).ok, true);
  assert.equal(limit('a', t0 + 2).ok, true);
  const blocked = limit('a', t0 + 3);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfterSeconds, 60);
  assert.equal(limit('b', t0 + 3).ok, true, 'other people are not affected');
  assert.equal(limit('a', t0 + 60_001).ok, true, 'oldest hit has expired');
});

test('reads the client address from proxy headers', () => {
  assert.equal(clientKey(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' })), '1.2.3.4');
  assert.equal(clientKey(new Headers({ 'x-real-ip': '5.6.7.8' })), '5.6.7.8');
  assert.equal(clientKey(new Headers()), 'unknown');
});
