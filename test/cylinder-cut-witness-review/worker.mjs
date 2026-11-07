// Recorded genuine Native receipt replay only. All modified records/accessors
// below are SYNTHETIC review controls, never newly computed Native geometry.
import {parentPort,workerData} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {deriveCylinderCutWitness} from '../../modules/engine/mount/cylinderCutWitness.mjs';
const bytes=readFileSync(new URL('../cylinder-cut-witness/fresh-evidence-r1/native.json',import.meta.url)),receipt=JSON.parse(bytes),row=receipt.rows.find(r=>r.name===(workerData.caseName||'plate100'));
const input={operation:row.operation,sourceTopologies:row.sourceTopologies,result:row.result,topology:row.topology,toolConstruction:row.toolConstruction,toolRequest:row.toolRequest};
let reads=0;
if(workerData.mode==='permuted-copy-certificate'){
 const map=input.result.sourceCopyB.faces;[map[0].target,map[1].target]=[map[1].target,map[0].target];
}
if(workerData.mode==='different-finite-extent'){
 input.toolRequest.depth=1;input.toolRequest.frame.origin=input.toolRequest.frame.origin.map((n,i)=>n+100*input.toolRequest.frame.z[i]);
}
if(workerData.mode==='construction-status-getter')Object.defineProperty(input.toolConstruction,'status',{enumerable:true,get(){reads++;return 'available';}});
if(workerData.mode==='construction-edge-getter'){
 const edges=input.toolConstruction.data.sourceLoops[0].edges,edge=edges[0];
 Object.defineProperty(edges,'0',{enumerable:true,get(){reads++;input.toolRequest.depth=1;return edge;}});
}
const originalDepth=input.toolRequest.depth;
try{const witness=deriveCylinderCutWitness(input);parentPort.postMessage({mode:workerData.mode,caseName:row.name,status:'RETURNED',reads,originalDepth,currentDepth:input.toolRequest.depth,witness,nativeReceiptSHA256:createHash('sha256').update(bytes).digest('hex')});}
catch(error){parentPort.postMessage({mode:workerData.mode,caseName:row.name,status:'REFUSED',reads,originalDepth,currentDepth:input.toolRequest.depth,error:{name:error.name,code:error.code,message:error.message},nativeReceiptSHA256:createHash('sha256').update(bytes).digest('hex')});}
