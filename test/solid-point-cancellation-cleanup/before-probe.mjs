import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fixture,source,counted,listenerCount,release} from './fixture.mjs';
const rows=[];
for(const registerThenThrow of [false,true]){
 const f=fixture(),caller=new AbortController(),add=caller.signal.addEventListener,cause=Error('own add override'),project=counted(f.document.signal);Object.defineProperty(caller.signal,'addEventListener',{value(...args){if(registerThenThrow)add.apply(this,args);throw cause;}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===cause);assert.equal(project.adds,1);assert.equal(project.removes,0);assert.equal(listenerCount(f.document.signal),1);assert.equal(f.calls.length,0);rows.push({case:'true signal add override',registerThenThrow,earlierProjectListenerLeaked:true,evaluatorCalls:0});release(f.document.signal);release(caller.signal);f.close();
}
for(const projectThrows of [false,true]){
 const f=fixture(),caller=new AbortController(),cause=Error('own remove override'),signal=projectThrows?f.document.signal:caller.signal;Object.defineProperty(signal,'removeEventListener',{value(){throw cause;}});await assert.rejects(f.api.classifyWorkerSolidPoints(f.request,{signal:caller.signal}),e=>e===cause);assert.equal(f.calls.length,1);assert.equal(listenerCount(caller.signal),1);rows.push({case:projectThrows?'project remove override':'caller remove override',originalEvaluatorFailureReplaced:true,laterCallerSubscriptionStillInstalled:true,evaluatorCalls:1});release(f.document.signal);release(caller.signal);f.close();
}
const receipt={status:'CONFIRMED_SYNTHETIC_SERVICE_CONTRACT_DEFECTS',sourceSha256:createHash('sha256').update(source).digest('hex'),scope:'exact service with explicit model/metadata admission doubles and strictly error-only evaluator; no native geometry/classification/public authoring',rows};await writeFile(process.argv[2]||'/tmp/point-cancel-before.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
