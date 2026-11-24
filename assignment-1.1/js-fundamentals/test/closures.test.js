import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCounter, memoize } from '../src/closures.js';

test('makeCounter keeps private state', () => {
  const counter = makeCounter(5);
  assert.equal(counter.value, 5);
  assert.equal(counter.inc(), 6);
  assert.equal(counter.inc(), 7);
  assert.equal(counter.dec(), 6);
  assert.equal(counter.value, 6);

  const other = makeCounter();
  assert.equal(other.value, 0);
  assert.equal(counter.value, 6);
});

test('memoize caches results by argument', () => {
  let calls = 0;
  const double = memoize((n) => { calls++; return n * 2; });
  assert.equal(double(4), 8);
  assert.equal(double(4), 8);
  assert.equal(double(5), 10);
  assert.equal(calls, 2);
});
