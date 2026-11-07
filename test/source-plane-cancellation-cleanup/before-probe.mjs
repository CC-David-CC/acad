import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {api,source,counted,withSubmit,drain,lifecycle,requests} from './fixture.mjs';
const text=await source(),rows=[];
{
 const f=api.fixture(text),project=counted(f.ctx.projectService.documentSignal),caller=new AbortController(),cause=Error('own add override');Object.defineProperty(caller.signal,'addEventListener',{value(){throw cause;}});const n=requests.length;await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e===cause);assert.equal(project.adds,1);assert.equal(project.removes,0);assert.equal(requests.length,n);rows.push({case:'true signal add override',priorProjectListenerLeaked:true,workersDispatched:0});f.close();
}
{
 const f=api.fixture(text),caller=new AbortController(),cause=Error('own remove override');Object.defineProperty(caller.signal,'removeEventListener',{value(){throw cause;}});await assert.rejects(f.api.editSourcePlaneDepth(f.request(0),{signal:caller.signal}),e=>e===cause);rows.push({case:'true signal remove override on no-op',ordinaryReceiptReplaced:true});f.close();
}
for(const committed of [false,true]){
 const primary=Object.assign(Error('controlled publication boundary; native not run'),{code:'NATIVE_NOT_RUN',...(committed?{committed:true}:{})}),f=withSubmit(text,primary),caller=new AbortController(),cleanup=Error('own remove override');Object.defineProperty(caller.signal,'removeEventListener',{value(){throw cleanup;}});await assert.rejects(f.api.editSourcePlaneDepth(f.request(12),{signal:caller.signal}),e=>e===cleanup);assert.equal(f.events.writes.length,1);assert.equal(f.events.discards,0);assert.equal(f.events.commits,0);rows.push({case:committed?'committed-marked primary error':'ordinary primary error',primaryReplaced:true,preparedWorkspaceNotDiscarded:true,realSourceWorkerPreparation:true,nativePublication:false});f.close();
}
await drain();assert.equal(lifecycle.started,lifecycle.terminated);const bytes=await readFile(new URL('../../web/app/cad/craft/sourcePlaneDepthCommands.ts',import.meta.url));const receipt={status:'CONFIRMED_SYNTHETIC_SERVICE_CONTRACT_DEFECTS',sourceSha256:createHash('sha256').update(bytes).digest('hex'),rows,workers:lifecycle,scope:'Actual plane/source/production Workers; controlled error-only submit, no native success/public incident'};await writeFile(process.argv[2]||'/tmp/plane-cancel-before.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
