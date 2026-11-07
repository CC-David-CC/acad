import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostLifetime} from '../../web/app/cad/projectManager/hostLifetime.mjs';

test('host abort disposes once and prevents rebinding', () => {
  let disposed = 0;
  const host = new AbortController(), lifetime = createHostLifetime(() => disposed++);
  assert.equal(lifetime.current(), true);
  assert.equal(lifetime.bound, false);
  lifetime.bind({signal: host.signal, valid: () => true});
  assert.equal(lifetime.bound, true);
  assert.equal(lifetime.current(), true);
  assert.throws(() => lifetime.bind({signal: host.signal, valid: () => true}));
  host.abort(); host.abort(); lifetime.dispose();
  assert.equal(disposed, 1);
  assert.equal(lifetime.current(), false);
  assert.equal(lifetime.bound, false);
  assert.throws(() => lifetime.bind({signal: new AbortController().signal, valid: () => true}));
});

test('validity is rechecked and callback errors or recursion fail closed', () => {
  let check = () => true;
  const lifetime = createHostLifetime(() => {});
  lifetime.bind({signal: new AbortController().signal, valid: () => check()});
  check = () => false;
  assert.equal(lifetime.current(), false);
  check = () => { throw Error('Account unavailable'); };
  assert.equal(lifetime.current(), false);
  check = () => lifetime.current();
  assert.equal(lifetime.current(), false);
  check = () => { lifetime.dispose(); return true; };
  assert.equal(lifetime.current(), false);
});

test('binding rejects malformed input and pre-aborted hosts; dispose detaches the listener', () => {
  let disposed = 0, getterCalls = 0;
  const host = new AbortController(), lifetime = createHostLifetime(() => disposed++);
  assert.throws(() => lifetime.bind({get signal() { getterCalls++; return host.signal; }, valid: () => true}));
  assert.equal(getterCalls, 0);
  assert.throws(() => lifetime.bind({signal: {}, valid: () => true}), TypeError);
  lifetime.bind({signal: host.signal, valid: () => true});
  lifetime.dispose(); host.abort();
  assert.equal(disposed, 0);
  const aborted = new AbortController(); aborted.abort();
  const alreadyClosed = createHostLifetime(() => disposed++);
  assert.throws(() => alreadyClosed.bind({signal: aborted.signal, valid: () => true}), {name: 'AbortError'});
  assert.equal(disposed, 1);
  assert.equal(alreadyClosed.current(), false);
});
