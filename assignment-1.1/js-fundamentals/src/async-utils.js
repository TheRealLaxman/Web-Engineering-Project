export const sleep = (ms, { signal } = {}) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(abortReason(signal));
    return;
  }

  let timer;
  const onAbort = () => {
    clearTimeout(timer);
    reject(abortReason(signal));
  };

  timer = setTimeout(() => {
    signal?.removeEventListener('abort', onAbort);
    resolve();
  }, ms);
  signal?.addEventListener('abort', onAbort, { once: true });
});

function abortReason(signal) {
  return signal.reason ?? new DOMException('Aborted', 'AbortError');
}

function raceAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortReason(signal));

  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(abortReason(signal));
    signal.addEventListener('abort', onAbort, { once: true });
  });

  return Promise.race([promise, aborted]).finally(() => {
    signal.removeEventListener('abort', onAbort);
  });
}

export async function retry(fn, { retries = 3, delayMs = 100, signal } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw abortReason(signal);

    try {
      return await raceAbort(Promise.resolve().then(() => fn(attempt, signal)), signal);
    } catch (err) {
      if (signal?.aborted) throw abortReason(signal);
      lastError = err;
      if (attempt < retries) await sleep(delayMs * 2 ** attempt, { signal });
    }
  }
  throw lastError;
}

export function withTimeout(promise, ms, { signal } = {}) {
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal.reason);

  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener('abort', onAbort, { once: true });

  const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${ms}ms`)), ms);

  return raceAbort(promise, controller.signal).finally(() => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  });
}

export async function pool(tasks, limit = 2) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
