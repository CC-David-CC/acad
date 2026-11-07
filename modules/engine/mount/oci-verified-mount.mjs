import {createWorkerMount} from './worker-controller.mjs';
export function createVerifiedOciMount(options) {
  return createWorkerMount(options, Object.freeze({engine:'occ-oci-verified-runtime-research',representation:'occ-brep-worker-owned',mesh:false,profile:true,centeredCut:true,fourCornerCut:true,enclosure:true,
    jsSha256:'a84b31900e58e61a1d7e3f8d04978408455764ad149923359e7fba19d3d07884',
    wasmSha256:'07d763a05f35cd257501d339d9087df63c65bcaeb51a4f4f80832e333892e12e'}));
}
