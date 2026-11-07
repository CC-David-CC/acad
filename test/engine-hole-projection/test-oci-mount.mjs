// Fixture-only native-runtime pin substitution; never packaged as product.
import {createWorkerMount} from '../../modules/engine/mount/worker-controller.mjs';
export function createVerifiedOciMount(options){return createWorkerMount(options,Object.freeze({engine:'occ-oci-verified-runtime-research',representation:'occ-brep-worker-owned',mesh:false,profile:true,centeredCut:true,jsSha256:'f74142622c9ced56b8f2e7955301ace5902f811734a71128767fb05de4159972',wasmSha256:'c39793b8aff34dc548b57fee1d901219e372702a5005ef92dfdf94994c012897'}));}
