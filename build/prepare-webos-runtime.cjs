#!/usr/bin/env node
// Install previously source-built, pinned runtime artifacts in the ignored
// dependency tree. This does not download binaries or establish license clearance.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const [occJs, occWasm, manifoldJs, manifoldWasm, workerOccJs, workerOccWasm] = process.argv.slice(2);
if (!occJs || !occWasm || !manifoldJs || !manifoldWasm || !workerOccJs || !workerOccWasm || process.argv.length !== 8) {
  console.error('Usage: node build/prepare-webos-runtime.cjs legacy-OCC.js legacy-OCC.wasm manifold.js manifold.wasm worker-OCC.js worker-OCC.wasm');
  process.exit(2);
}
const files = [
  [occJs, 'node_modules/jsketcher-occ-engine/occt.js', '3c56e74e6e08411436a68fb930bab38aedd3137e4369af2bc67fd382e568787e'],
  [occWasm, 'node_modules/jsketcher-occ-engine/occt.wasm', 'a2b2f7daf6a4eb98b975f8aec136f6cbaf2720295ea32e71edb13ff4c5ceaecb'],
  [manifoldJs, 'node_modules/.cache/codi-manifold/manifold.js', 'cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b'],
  [manifoldWasm, 'node_modules/.cache/codi-manifold/manifold.wasm', '7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d'],
  [workerOccJs, 'node_modules/.cache/codi-oci-census/main.js', '7dfb70d551333756d9936f7a7882d9f8f5482b921c7bee398e95ad03ef979641'],
  [workerOccWasm, 'node_modules/.cache/codi-oci-census/main.wasm', '07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e'],
];
// Validate every input before copying any of them.
const inputs = files.map(([source, destination, expected]) => {
  const data = fs.readFileSync(source);
  if (crypto.createHash('sha256').update(data).digest('hex') !== expected) throw new Error(`Artifact hash mismatch: ${source}`);
  return {data, destination};
});
if (!fs.existsSync('node_modules/jsketcher-occ-engine/package.json')) throw new Error('Run npm ci first.');
for (const {data, destination} of inputs) {
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, data);
}
const prep = spawnSync(process.execPath, ['build/precompile-numeric.cjs'], {stdio: 'inherit'});
if (prep.error) throw prep.error;
if (prep.status !== 0) process.exit(prep.status || 1);
console.log('Pinned WebOS runtime inputs prepared; build with CODI_EMBED_NUMERIC=1 CODI_EMBED_MANIFOLD=1 npm run build.');
