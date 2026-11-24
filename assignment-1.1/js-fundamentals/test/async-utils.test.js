import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retry, withTimeout, pool, sleep } from '../src/async-utils.js';

test('retry succeeds after failures', async () => {
  let calls = 0;
  const result = await retry(async () => {
    if (++calls < 3) throw new Error('flaky');
    return 'ok';
  }, { retries: 3, delayMs: 5 });
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
});

test('retry stops after retries are exhausted', async () => {
  let calls = 0;
  await assert.rejects(
    retry(async () => { calls++; throw new Error('still broken'); }, { retries: 2, delayMs: 1 }),
    /still broken/,
  );
  assert.equal(calls, 3);
});

test('retry passes attempt number and signal to the task', async () => {
  const controller = new AbortController();
  const seen = [];
  await retry(async (attempt, signal) => {
    seen.push([attempt, signal]);
  }, { signal: controller.signal });
  assert.deepEqual(seen.map(([attempt]) => attempt), [0]);
  assert.equal(seen[0][1], controller.signal);
});

test('retry aborts an in-flight task when the signal fires', async () => {
  const controller = new AbortController();
  const reason = new Error('cancelled');
  const started = new Promise((resolve) => {
    controller.signal.addEventListener('abort', resolve, { once: true });
  });
  const pending = retry(async () => {
    await new Promise((resolve) => controller.signal.addEventListener('abort', resolve, { once: true }));
    throw new Error('should not win');
  }, { signal: controller.signal });

  controller.abort(reason);
  await started;
  await assert.rejects(pending, (err) => err === reason);
});

test('withTimeout rejects slow work', async () => {
  await assert.rejects(withTimeout(sleep(200), 20), /Timed out after 20ms/);
});

test('withTimeout resolves fast work and clears its timer', async () => {
  assert.equal(await withTimeout(Promise.resolve('fast'), 50), 'fast');
});

test('withTimeout rejects early when the caller aborts', async () => {
  const controller = new AbortController();
  const reason = new Error('cancelled by caller');
  const pending = withTimeout(sleep(500, { signal: controller.signal }), 500, { signal: controller.signal });
  setTimeout(() => controller.abort(reason), 5);
  await assert.rejects(pending, (err) => err === reason);
});

test('pool preserves order', async () => {
  const out = await pool([1, 2, 3].map((n) => async () => {
    await sleep(10);
    return n;
  }), 2);
  assert.deepEqual(out, [1, 2, 3]);
});

test('pool limits concurrency', async () => {
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 5 }, () => async () => {
    active++;
    peak = Math.max(peak, active);
    await sleep(5);
    active--;
    return active;
  });
  const out = await pool(tasks, 2);
  assert.equal(peak, 2);
  assert.equal(out.length, 5);
});
