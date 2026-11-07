// Recorded Native data replayed in a real Worker. Every mutation is a synthetic
// support-equivalence or malformed control, never new Native geometry.
import {parentPort,workerData} from 'node:worker_threads';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {deriveCylinderCutWitness} from '../../modules/engine/mount/cylinderCutWitness.mjs';
const file=new URL('../owned-boolean-contract/native-main-receipt.json',import.meta.url),bytes=fs.readFileSync(file),receipt=JSON.parse(bytes),row=receipt.rows.find(r=>r.name==='real-circle-through-cut'),tool=receipt.initial.find(r=>r.name===row.b),sha=x=>createHash('sha256').update(x).digest('hex');
const request={op:'solid.profile.extrude',version:3,unit:'millimeter',frame:{origin:[0,0,-1],x:[1,0,0],y:[0,1,0],z:[0,0,1]},depth:22,region:{id:'recorded-circle-tool',outer:[{kind:'circle',id:'recorded-circle-slot',center:[50,25],radius:5}],holes:[]}};
const input={operation:['union','subtract','common'][row.kind],sourceTopologies:[row.inputA.before.catalog,row.inputB.before.catalog],result:row.value,topology:row.output.catalog,toolConstruction:tool.value.constructionProvenance,toolRequest:request};let reads=0;
const mode=workerData.mode;
if(mode==='no-history')input.result.ancestryB={status:'unavailable',reason:'BOOLEAN_HISTORY_UNSUPPORTED'};
if(mode==='split-descendant')input.result.ancestryB.data.faces[0].modified.faces.push(1);
if(mode==='missing-descendant'){const r=input.result.ancestryB.data.faces[0];r.modified.faces=[];r.reportedDeleted=true;}
if(mode==='wrong-result-radius')input.topology.faces.find(f=>f.type==='cylinder').analytic.radius=6;
if(mode==='wrong-result-axis')input.topology.faces.find(f=>f.type==='cylinder').analytic.axis=[1,0,0];
if(mode==='wrong-result-position')input.topology.faces.find(f=>f.type==='cylinder').analytic.origin[0]+=1;
if(mode==='shifted-origin-same-support')input.topology.faces.find(f=>f.type==='cylinder').analytic.origin[2]+=100;
if(mode==='reversed-axis-same-support')input.topology.faces.find(f=>f.type==='cylinder').analytic.axis=input.topology.faces.find(f=>f.type==='cylinder').analytic.axis.map(n=>-n);
if(mode==='nominal-radius-mismatch')input.toolRequest.region.outer[0].radius=99;
if(mode==='nominal-center-mismatch')input.toolRequest.region.outer[0].center[0]+=1;
if(mode==='copy-corrupt')input.result.sourceCopyB.faces[0].target=2;
if(mode==='non-circle')input.toolRequest.region.outer=[{kind:'segment',id:'a',a:[0,0],b:[10,0]},{kind:'segment',id:'b',a:[10,0],b:[10,10]},{kind:'segment',id:'c',a:[10,10],b:[0,10]},{kind:'segment',id:'d',a:[0,10],b:[0,0]}];
if(mode==='wrong-operation')input.operation='common';
if(mode==='top-getter')Object.defineProperty(input,'result',{enumerable:true,get(){reads++;throw Error('Getter executed');}});
const before=mode==='top-getter'?null:JSON.stringify(input);
try{const witness=deriveCylinderCutWitness(input);parentPort.postMessage({status:'PASS',mode,witness,sourceSHA:sha(bytes),runtimePins:receipt.runtimePins,inputUnchanged:JSON.stringify(input)===before,frozen:Object.isFrozen(witness)&&Object.isFrozen(witness.cylinder)&&Object.isFrozen(witness.cylinder.origin)&&Object.isFrozen(witness.cylinder.axis),reads,actualSourceValues:tool.values});}
catch(error){parentPort.postMessage({status:'REFUSED',mode,error:{name:error.name,message:error.message,code:error.code},sourceSHA:sha(bytes),inputUnchanged:before===null?true:JSON.stringify(input)===before,reads});}
