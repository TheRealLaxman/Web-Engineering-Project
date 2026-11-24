import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TaskQueue } from '../src/task-queue.js';

test('TaskQueue runs tasks in order and empties itself', async () => {
  const before = TaskQueue.created;
  const queue = new TaskQueue('demo');
  assert.equal(TaskQueue.created, before + 1);
  assert.equal(queue.name, 'demo');

  const seen = [];
  const returned = queue
    .push(async () => { seen.push('first'); return 1; })
    .push(async () => { seen.push('second'); return 2; });

  assert.equal(returned, queue);
  assert.equal(queue.size, 2);
  assert.deepEqual(await queue.runAll(), [1, 2]);
  assert.deepEqual(seen, ['first', 'second']);
  assert.equal(queue.size, 0);
});
