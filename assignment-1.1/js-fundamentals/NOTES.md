# Assignment 1.1 — js-fundamentals notes

Node v24.22.0, ESM (`"type": "module"`), no bundler or dependencies.

## Files

| File | Purpose |
| --- | --- |
| `src/async-utils.js` | `sleep`, `retry`, `withTimeout`, `pool` (with AbortSignal support) |
| `src/index.js` | Top-level `await` plus `createRequire` CJS interop |
| `src/legacy.cjs` | Tiny CommonJS module loaded from ESM |
| `src/event-loop.js` | Part C ordering lab |
| `src/starvation.js` | Microtask starvation demo |
| `src/closures.js` | `makeCounter`, `memoize` |
| `src/task-queue.js` | `TaskQueue` with `#private` fields |
| `test/*.test.js` | `node:test` suites (12 tests) |
| `screenshots/` | PNG captures and matching text transcripts |

Run with `npm start`, `npm test`, `npm run eventloop`, `npm run starvation`.

## Part C — predicted vs actual order

**Prediction (on paper, conventional teaching order):**

```
1 sync start
2 sync inside async fn (before first await)
2b sync end
3 nextTick
4 microtask: promise.then
5 microtask: queueMicrotask
5b microtask: after await
6 macrotask: setTimeout 0
7 macrotask: setImmediate
```

**Actual (`node src/event-loop.js`, Node v24.22.0, ESM):**

```
1 sync start
2 sync inside async fn (before first await)
2b sync end
4 microtask: promise.then
5 microtask: queueMicrotask
5b microtask: after await
3 nextTick
7 macrotask: setImmediate
6 macrotask: setTimeout 0
```

### Why the prediction differed

- `1`, `2`, `2b` are all synchronous: the async function runs synchronously until its first `await`, so its first log belongs with the current task.
- After the stack unwinds, the promise microtasks drain in FIFO order: `.then` → `queueMicrotask` → the `await null` continuation (`5b`). The whole microtask queue is drained before the next macrotask.
- `process.nextTick` is Node-specific rather than a standard microtask. In this ESM module, the V8 microtask checkpoint at the end of module evaluation runs before Node processes its nextTick queue, so `3` appears **after** `4`, `5`, `5b`. A CJS version of the same lab commonly prints `3` before the promise microtasks, e.g. `node -e "process.nextTick(() => console.log('tick')); Promise.resolve().then(() => console.log('p'))"` prints `tick` then `p`. Both are valid Node behaviours; the teaching rule "nextTick before promises" is not guaranteed in ESM top-level code.
- `6` and `7` are macrotasks. Node runs timers in the *timers* phase and `setImmediate` in the later *check* phase, but `setTimeout(fn, 0)` is stored as ~1 ms. From the main module, if that deadline has not elapsed by the timers phase, the check phase runs first (`7` then `6`); if it has elapsed, timers run first (`6` then `7`). Repeated runs of this script produced both orders, confirming the variability.

### `src/starvation.js`

Actual output:

```
microtasks done
timer never fires while microtasks recurse
```

The recursive `queueMicrotask(spin)` chain keeps re-filling the microtask queue, and Node drains microtasks to empty before advancing to the timers phase. The 0 ms timer callback is therefore starved until all 100,000 microtasks finish. Microtasks can starve macrotasks and I/O.

## Screenshots

- `screenshots/npm-test.png` — `npm test`, 12/12 passing (`screenshots/npm-test.txt`)
- `screenshots/event-loop.png` — event-loop output above (`screenshots/event-loop.txt`)

## Short answers

**1. CJS vs ESM (two differences).** CJS uses `require()` / `module.exports`, loads synchronously at runtime, has built-in `__dirname`, has no top-level `await`, and is the default for `.js` without `"type": "module"` (or `.cjs`). ESM uses `import` / `export`, is statically analysable (async-capable and tree-shakeable), uses `import.meta.dirname`, supports top-level `await`, and is enabled with `"type": "module"` or `.mjs`.

**2. Why `await` does not block the thread.** `await` suspends only the enclosing async function: it returns control to the event loop immediately and registers the rest of that function as a microtask to resume when the awaited promise settles. Other code, I/O and timers keep running on the same thread.

**3. Why microtasks run before `setTimeout(…, 0)`.** After the current synchronous task finishes, the runtime drains the entire microtask queue (promise callbacks, `queueMicrotask`, `await` continuations) before taking the next macrotask from the event loop. A timer callback is a macrotask in a later loop turn, even with a 0 ms delay.

## Bonus — AbortSignal support

- `retry(fn, { retries, delayMs, signal })`: passes `(attempt, signal)` to each attempt, skips/aborts retries when the signal fires, aborts the exponential-backoff `sleep`, and races each attempt so cancellation works even if `fn` ignores the signal.
- `withTimeout(promise, ms, { signal })`: an internal `AbortController` is aborted either by the caller's signal or by the timer. The race rejects with the caller's `signal.reason` or `Error("Timed out after <ms>ms")`, and the timer and listeners are always cleaned up in `finally`.
- Tests `retry aborts an in-flight task when the signal fires` and `withTimeout rejects early when the caller aborts` cover cancellation.
