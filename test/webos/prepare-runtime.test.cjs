const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

test('unverified runtime input cannot replace existing installed artifacts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsketcher-runtime-test-'));
  try {
    const target = path.join(dir, 'node_modules/jsketcher-occ-engine');
    fs.mkdirSync(target, {recursive: true});
    fs.writeFileSync(path.join(target, 'package.json'), '{}');
    fs.writeFileSync(path.join(target, 'occt.js'), 'previous-good-runtime');
    const wrong = path.join(dir, 'bad-artifact');
    fs.writeFileSync(wrong, 'not-the-pinned-build');
    const script = path.resolve('build/prepare-webos-runtime.cjs');
    const result = spawnSync(process.execPath, [script, wrong, wrong, wrong, wrong, wrong, wrong], {cwd: dir, encoding: 'utf8'});
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Artifact hash mismatch/);
    assert.equal(fs.readFileSync(path.join(target, 'occt.js'), 'utf8'), 'previous-good-runtime');
    assert.equal(fs.existsSync(path.join(dir, 'node_modules/.cache/codi-manifold')), false);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

test('tampered clean worker input leaves both installed runtime families untouched', (t) => {
  const root = process.cwd();
  const paths = [
    'node_modules/jsketcher-occ-engine/occt.js', 'node_modules/jsketcher-occ-engine/occt.wasm',
    'node_modules/.cache/codi-manifold/manifold.js', 'node_modules/.cache/codi-manifold/manifold.wasm',
    'node_modules/.cache/codi-oci-clean/main.js',
  ].map(p => path.join(root, p));
  if (!paths.every(fs.existsSync)) return t.skip('Pinned runtime prerequisites not installed');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsketcher-clean-runtime-test-'));
  try {
    const target = path.join(dir, 'node_modules/jsketcher-occ-engine');
    fs.mkdirSync(target, {recursive:true});
    fs.writeFileSync(path.join(target, 'package.json'), '{}');
    fs.writeFileSync(path.join(target, 'occt.js'), 'previous-legacy');
    const clean = path.join(dir, 'node_modules/.cache/codi-oci-clean');
    fs.mkdirSync(clean, {recursive:true});
    fs.writeFileSync(path.join(clean, 'main.js'), 'previous-worker');
    const bad = path.join(dir, 'bad-worker.wasm');fs.writeFileSync(bad, 'tampered');
    const run = spawnSync(process.execPath, [path.join(root, 'build/prepare-webos-runtime.cjs'), ...paths, bad], {cwd:dir, encoding:'utf8'});
    assert.notEqual(run.status, 0);assert.match(run.stderr, /Artifact hash mismatch/);
    assert.equal(fs.readFileSync(path.join(target, 'occt.js'), 'utf8'), 'previous-legacy');
    assert.equal(fs.readFileSync(path.join(clean, 'main.js'), 'utf8'), 'previous-worker');
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});
