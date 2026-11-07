import {parentPort} from 'node:worker_threads';
import {measureExactSignedMeshVolume} from '../../modules/engine/mount/exactMeshVolume.mjs';
const rows=[];
for(const scale of [1e200,1e-200]){try{const result=measureExactSignedMeshVolume(new Float64Array([scale,0,0,0,scale,0,0,0,scale]));rows.push({scale,unexpectedResult:result});}catch(e){rows.push({scale,code:e.code,message:e.message});}}
parentPort.postMessage({scope:'Actual oriented triangle integral range; not a closed mesh/native CAD geometry or public admission',rows});
