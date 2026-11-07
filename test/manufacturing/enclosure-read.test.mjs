import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readManufacturingEnclosurePair as read} from '../../web/app/cad/export/enclosureManufacturingRead.mjs';
function fixture(version=1){
 const state={current:true,closed:0,reads:[],created:0},handles={BODY:{id:'body'},LID:{id:'lid'},LABEL:{id:'label'}};
 const mount={ready:Promise.resolve(),async createEnclosure(request){state.created++;assert.equal(request.version,version);return {...(version===2?{label:{role:'LABEL',handle:handles.LABEL}}:{}),body:{role:'BODY',handle:handles.BODY},lid:{role:'LID',handle:handles.LID}}},assertEnclosureBinding(a,b,label){if(version===2)assert.equal(label,handles.LABEL);assert.equal(a,handles.BODY);assert.equal(b,handles.LID)},async readEnclosureManufacturingMesh(request){state.reads.push(request);return {role:request.handle===handles.BODY?'BODY':request.handle===handles.LID?'LID':'LABEL',unit:'millimeter',quality:'planar-boundary-checked-v1',vertices:new Float64Array(12),triangles:new Uint32Array(12)}},close(){state.closed++}};
 return {state,mount,args:{version,plan:{unit:'millimeter'},createMount:()=>mount,isCurrent:()=>state.current}};
}
test('disposable reconstruction returns role arrays and closes ownership',async()=>{const f=fixture(),parts=await read(f.args);assert.deepEqual(Object.keys(parts),['BODY','LID']);assert.equal(f.state.reads.length,2);assert.equal(f.state.closed,1);assert.ok(f.state.reads.every(r=>r.op==='solid.enclosure.manufacturing-mesh'));});
test('stale revision during read refuses publication and closes mount',async()=>{const f=fixture(),original=f.mount.readEnclosureManufacturingMesh;f.mount.readEnclosureManufacturingMesh=async request=>{const result=await original(request);f.state.current=false;return result};await assert.rejects(read(f.args),{name:'AbortError'});assert.equal(f.state.reads.length,1);assert.equal(f.state.closed,1);});
test('cancellation during readiness closes without creating geometry',async()=>{const f=fixture(),controller=new AbortController();f.mount.ready=new Promise(()=>{});const pending=read({...f.args,signal:controller.signal});controller.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(f.state.created,0);assert.equal(f.state.closed,1);});
test('pre-cancelled caller never allocates and cleanup failure refuses result',async()=>{const f=fixture(),controller=new AbortController();controller.abort();await assert.rejects(read({...f.args,signal:controller.signal}),{name:'AbortError'});assert.equal(f.state.closed,0);f.mount.close=()=>{throw Error('cleanup failure')};await assert.rejects(read(f.args),/cleanup failure/);});
test('v2 requires a same-triple contact operation after all three mesh reads',async()=>{
 const f=fixture(2);f.mount.readEnclosureInterface=async request=>{assert.equal(f.state.reads.length,3);assert.equal(request.body.id,'body');assert.equal(request.lid.id,'lid');assert.equal(request.label.id,'label');return {version:1,quality:'paired-planar-contact-v1',unit:'millimeter',maxDeviationMm:request.maxDeviationMm,surfaceCount:5,commonVolume:0,roles:['LID','LABEL']};};
 const result=await read(f.args);assert.equal(result.LABEL.role,'LABEL');assert.equal(result.interfaceEvidence.surfaceCount,5);assert.equal(f.state.closed,1);
});
test('v2 refuses absent or insufficient interface proof and closes ownership',async()=>{
 for(const proof of [null,{version:1,quality:'bounded-common-volume',commonVolume:0}]){const f=fixture(2);f.mount.readEnclosureInterface=async()=>proof;await assert.rejects(read(f.args),/contact/);assert.equal(f.state.closed,1);}
});
