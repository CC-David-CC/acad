import {createWorkerMount} from './worker-controller.mjs';
export function createVerifiedManifoldMount(options) {
  return createWorkerMount(options, Object.freeze({engine:'manifold-mesh-verified-runtime-research',representation:'manifold-mesh-worker-owned',mesh:true,enclosure:true,
    jsSha256:'cd2031fd75cbbc812b550dd228f95b9fd666ae4da6557f840e3d3ed4cbed268b',
    wasmSha256:'7bb5f8ee10fcafdab78799b1e5dd2cdc7c282ea0bf8e7939c43f3ad34b823e3d'}));
}
