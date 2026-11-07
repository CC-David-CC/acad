import test from 'node:test';
import assert from 'node:assert/strict';
import {activate, defineStreams} from '../../web/app/cad/storage/storageBundle.ts';

function workspace() {
  globalThis.window = {location: {search: '?webos=1'}};
  const ctx = {services: {}, streams: {}};
  defineStreams(ctx);
  activate(ctx);
  return ctx.services.storage;
}

test('staged new and overwritten values roll back exactly once', () => {
  const s = workspace();
  const created = s.stageWrite('new', 'candidate');
  assert.equal(s.get('new'), 'candidate');
  assert.equal(created(), true);
  assert.equal(s.get('new'), null);
  assert.equal(created(), false);
  s.set('existing', 'original');
  const overwritten = s.stageWrite('existing', 'candidate');
  assert.equal(overwritten(), true);
  assert.equal(s.get('existing'), 'original');
  assert.equal(overwritten(), false);
});

test('later identical or different writes are never undone', () => {
  for (const replacement of ['candidate', 'different']) {
    const s = workspace(); s.set('key', 'original');
    const rollback = s.stageWrite('key', 'candidate');
    s.set('key', replacement);
    assert.equal(rollback(), false);
    assert.equal(rollback(), false);
    assert.equal(s.get('key'), replacement);
  }
});

test('remove and recreate retain the newer value even with identical bytes', () => {
  const s = workspace(); s.set('key', 'original');
  const rollback = s.stageWrite('key', 'candidate');
  s.remove('key'); s.set('key', 'candidate');
  assert.equal(rollback(), false);
  assert.equal(s.get('key'), 'candidate');
});

test('a later remove is preserved and a consumed receipt cannot delete a future write', () => {
  const s = workspace(); s.set('key', 'original');
  const rollback = s.stageWrite('key', 'candidate');
  s.remove('key');
  assert.equal(rollback(), false);
  s.set('key', 'future');
  assert.equal(rollback(), false);
  assert.equal(s.get('key'), 'future');
});

test('independent staged keys can be unwound in reverse order', () => {
  const s = workspace(); s.set('one', 'original');
  const first = s.stageWrite('one', 'staged one');
  const second = s.stageWrite('two', 'staged two');
  assert.equal(second(), true); assert.equal(first(), true);
  assert.equal(s.get('one'), 'original'); assert.equal(s.get('two'), null);
});

test('storage instances have independent ownership and nonvolatile staging fails closed', () => {
  const a = workspace(), b = workspace();
  const rollback = a.stageWrite('key', 'candidate');
  b.set('key', 'other');
  assert.equal(rollback(), true);
  assert.equal(a.get('key'), null);
  assert.equal(b.get('key'), 'other');
  globalThis.window = {location: {search: ''}, addEventListener() {}};
  const ctx = {services: {}, streams: {}}; defineStreams(ctx); activate(ctx);
  assert.throws(() => ctx.services.storage.stageWrite('key', 'candidate'), /volatile/);
});
