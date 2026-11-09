'use strict';
// Emscripten2.0.30 otherwise selects Node's fetch for an absolute filesystem
// WASM path. Node24 removed --no-experimental-fetch. This preload runs only in
// the separate artifact-reader process and selects its real generated fs path.
globalThis.fetch = undefined;
