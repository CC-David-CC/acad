// Test-only research runtime substitution; never packaged as product.
import {createWorkerMount} from '../../modules/engine/mount/worker-controller.mjs';
export function createVerifiedOciMount(options){return createWorkerMount(options,Object.freeze({engine:'occ-oci-verified-runtime-research',representation:'occ-brep-worker-owned',mesh:false,profile:true,centeredCut:true,fourCornerCut:true,jsSha256:'a8774acbbe3a90d7c82fe294c769096179eae351e5a8c854d4d0a31737a706ee',wasmSha256:'0e08888f09c34f79b858cefc2859cbb59fbea1af6505b04686343eac7f9efc5b'}));}
