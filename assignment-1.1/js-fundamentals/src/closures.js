export function makeCounter(start = 0) {
  let count = start;
  return {
    inc: () => ++count,
    dec: () => --count,
    get value() { return count; },
  };
}

export function memoize(fn) {
  const cache = new Map();
  return (arg) => (cache.has(arg) ? cache.get(arg) : (cache.set(arg, fn(arg)), cache.get(arg)));
}
