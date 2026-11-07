import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,createHash} from 'node:crypto';
import {geometryRevision,manufacturingSnapshotDigest} from '../../web/app/cad/projectManager/manufacturingMetadata.mjs';
import {prepareManufacturingForSave} from '../../web/app/cad/projectManager/workerSavePreparation.mjs';
globalThis.crypto ||= webcrypto;
class HashWorker {
 listeners={message:new Set(),error:new Set()}; closed=false; hold=false; pending=null;
 addEventListener(k,f){this.listeners[k].add(f)} removeEventListener(k,f){this.listeners[k].delete(f)} terminate(){this.closed=true}
 postMessage(m){const respond=()=>{if(this.closed)return;let data;if(m.type==='start'){this.hash=createHash('sha256');data={type:'ready'}}else if(m.type==='chunk'){this.hash.update(new Uint8Array(m.bytes));data={type:'ack'}}else{const b=this.hash.digest();data={type:'result',bytes:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}}for(const fn of this.listeners.message)fn({data})};if(this.hold)this.pending=respond;else queueMicrotask(respond)}
}
const project={model:{history:[],expressions:'a'.repeat(1024*1024)},sketches:[]};
const metadata=revision=>({version:1,unit:'millimeter',revision,materials:[],appearances:[],bindings:[],objects:[]});
test('worker save uses legacy-compatible revision and snapshot digest with one capture',async()=>{const revision=await geometryRevision(project),data=metadata(revision),w=new HashWorker();const result=await prepareManufacturingForSave({project,manufacturing:data},{worker:w,getGeneration:()=>1});assert.equal(result.geometryRevision,revision);assert.equal(result.snapshotDigest,await manufacturingSnapshotDigest(project,data));assert.equal(result.envelope.manufacturing.revision,revision)});
test('stale generation and cancellation cannot publish',async()=>{const revision=await geometryRevision(project),data=metadata(revision);let gen=1,w=new HashWorker();w.hold=true;const pending=prepareManufacturingForSave({project,manufacturing:data},{worker:w,getGeneration:()=>gen});gen++;w.hold=false;w.pending();await assert.rejects(pending,/changed|stale/i);w=new HashWorker();w.hold=true;const controller=new AbortController(),cancelled=prepareManufacturingForSave({project,manufacturing:data},{worker:w,signal:controller.signal,getGeneration:()=>1});controller.abort();await assert.rejects(cancelled,/cancel/i);assert.equal(w.closed,true)});
test('bounded snapshots and stale material revision fail closed',async()=>{await assert.rejects(prepareManufacturingForSave({project,manufacturing:metadata('stale')},{worker:new HashWorker(),getGeneration:()=>0}),/changed|revision/i);await assert.rejects(prepareManufacturingForSave({project,manufacturing:metadata(await geometryRevision(project))},{worker:new HashWorker(),getGeneration:()=>0,maxBytes:1024}),/limit/i)});
