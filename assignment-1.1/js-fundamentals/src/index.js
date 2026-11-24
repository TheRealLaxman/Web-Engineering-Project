import { createRequire } from 'node:module';
import { sleep } from './async-utils.js';

const require = createRequire(import.meta.url);
const { add } = require('./legacy.cjs');

console.log('start');
console.log('CJS interop: add(2, 3) =', add(2, 3));
console.log('ESM dirname:', import.meta.dirname);
await sleep(100);
console.log('done after 100ms');
