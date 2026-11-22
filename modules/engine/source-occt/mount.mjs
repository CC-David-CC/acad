import {createWorkerMount} from '../mount/worker-controller.mjs';
import {sourceEngine} from './pins.mjs';

export function createSourcePrismMount(options) {
  return createWorkerMount(options,{
    engine:'libcascade-authored-rectangle',representation:'occ-brep-worker-owned',
    sourceRectangle:true,mesh:false,profile:true,jsSha256:sourceEngine.glue,wasmSha256:sourceEngine.wasm,
  });
}
