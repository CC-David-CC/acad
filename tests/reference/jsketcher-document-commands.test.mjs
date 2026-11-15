import assert from 'node:assert/strict';
import test from 'node:test';
import {registerDocumentSaveCommand} from '../apps/system/jsketcher/document-commands.mjs';

function fixture() {
  const lifetime = new AbortController(), handlers = new Map();
  const state = {session: {}, target: {revision: 'revision-1', path: null}, calls: []};
  const receipt = {path: '/part.jsketcher.json', version: 'v1', status: 'pending', serverStatus: 'not-verified'};
  state.save = async args => {state.calls.push(args); return receipt;};
  const stop = registerDocumentSaveCommand({signal: lifetime.signal, session: () => state.session,
    commands: {register(descriptor, handler) {handlers.set(descriptor.id, handler); return () => handlers.delete(descriptor.id);}}},
  {inspect: () => state.target, save: args => state.save(args)});
  return {state, receipt, lifetime, stop, handlers, run: args => handlers.get('save')(args)};
}

test('CAD Save passes explicit intent to the common file operation and returns its receipt', async () => {
  const f = fixture();
  const result = await f.run({revision: 'revision-1', path: '/part.jsketcher.json'});
  assert.equal(result, f.receipt);
  assert.deepEqual(f.state.calls, [{revision: 'revision-1', path: '/part.jsketcher.json'}]);
  assert.equal(Object.isFrozen(f.state.calls[0]), true);
  f.stop(); assert.equal(f.handlers.size, 0);
});

test('stale revision and filename redirection cannot start a save', async () => {
  const f = fixture();
  await assert.rejects(f.run({revision: 'old', path: '/part.jsketcher.json'}), /model changed/);
  await assert.rejects(f.run({revision: 'revision-1'}), /untitled/);
  f.state.target.path = '/open.jsketcher.json';
  await assert.rejects(f.run({revision: 'revision-1', path: '/other.jsketcher.json'}), /open project path/);
  assert.equal(f.state.calls.length, 0);
  await f.run({revision: 'revision-1'});
  assert.deepEqual(f.state.calls, [{revision: 'revision-1'}]);
});

test('malformed fields and accessors reject without evaluating their values', async () => {
  const f = fixture(); let touched = false;
  const accessor = {revision: 'revision-1'};
  Object.defineProperty(accessor, 'path', {enumerable: true, get() {touched = true; return '/bad.jsketcher.json';}});
  for (const args of [null, [], {}, {revision: 1}, {revision: ''}, {revision: 'x'.repeat(257)},
    {revision: 'revision-1', path: ''}, {revision: 'revision-1', path: 'x'.repeat(1025)},
    {revision: 'revision-1', extra: 1}, {[Symbol('extra')]: 1, revision: 'revision-1'}, accessor]) {
    await assert.rejects(f.run(args));
  }
  assert.equal(touched, false); assert.equal(f.state.calls.length, 0);
});

test('closed windows and account changes reject before starting a write', async () => {
  const f = fixture(); f.lifetime.abort();
  await assert.rejects(f.run({revision: 'revision-1', path: '/part.jsketcher.json'}), /account changed/);
  assert.equal(f.state.calls.length, 0);
  const g = fixture(); g.state.session = null;
  await assert.rejects(g.run({revision: 'revision-1', path: '/part.jsketcher.json'}), /account changed/);
  assert.equal(g.state.calls.length, 0);
});

test('a session change during a possible write gives no success or automatic retry', async () => {
  const f = fixture();
  f.state.save = async args => {f.state.calls.push(args); f.state.session = {}; return f.receipt;};
  await assert.rejects(f.run({revision: 'revision-1', path: '/part.jsketcher.json'}), /outcome is unavailable/);
  assert.equal(f.state.calls.length, 1);
});

test('underlying failures and missing receipts do not become successful saves', async () => {
  const f = fixture(), error = Object.assign(Error('Lost response'), {possiblyCommitted: true});
  f.state.save = async () => {throw error;};
  await assert.rejects(f.run({revision: 'revision-1', path: '/part.jsketcher.json'}), actual => actual === error);
  f.state.save = async () => undefined;
  await assert.rejects(f.run({revision: 'revision-1', path: '/part.jsketcher.json'}), /outcome is unavailable/);
});
