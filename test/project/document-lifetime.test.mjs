import assert from 'node:assert/strict';
import test from 'node:test';
import {DocumentLifetime} from '../../web/app/cad/projectManager/documentLifetime.ts';

test('replacement invalidates and aborts earlier lifetimes even for identical content', () => {
  const lifetime = new DocumentLifetime();
  const first = lifetime.generation, signal = lifetime.signal;
  let observed;
  signal.addEventListener('abort', () => {
    observed = {generation: lifetime.generation, oldValid: lifetime.isCurrent(first), newSignalAborted: lifetime.signal.aborted};
  });
  const next = lifetime.begin();
  assert.equal(next, first + 1);
  assert.equal(signal.aborted, true);
  assert.deepEqual(observed, {generation: next, oldValid: false, newSignalAborted: false});
  assert.throws(() => lifetime.assertCurrent(first), {name: 'AbortError'});
  assert.doesNotThrow(() => lifetime.assertCurrent(next));
});

test('synchronous replacement from an abort listener cannot be adopted by its predecessor', () => {
  const lifetime = new DocumentLifetime();
  lifetime.signal.addEventListener('abort', () => lifetime.begin(), {once: true});
  const superseded = lifetime.begin();
  assert.equal(superseded, 1);
  assert.equal(lifetime.generation, 2);
  assert.throws(() => lifetime.assertCurrent(superseded), {name: 'AbortError'});
  assert.doesNotThrow(() => lifetime.assertCurrent(2));
});

test('dispose aborts the current generation and cannot be resumed', () => {
  const lifetime = new DocumentLifetime(), generation = lifetime.begin(), signal = lifetime.signal;
  lifetime.dispose();
  lifetime.dispose();
  assert.equal(signal.aborted, true);
  assert.equal(lifetime.isCurrent(generation), false);
  assert.throws(() => lifetime.begin(), {name: 'AbortError'});
});
