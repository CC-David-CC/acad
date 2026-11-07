import {parentPort,workerData} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {measureExactSignedMeshVolume as exact} from '../../modules/engine/mount/exactMeshVolume.mjs';
import {measureSignedMeshVolume as local} from '../../modules/engine/mount/localMeshVolume.mjs';
const cases=JSON.parse(readFileSync(new URL('./cases.json',import.meta.url))),oracle=JSON.parse(readFileSync(new URL('./fraction-oracle.json',import.meta.url))),rows=[];
const bits=n=>{const v=new DataView(new ArrayBuffer(8));v.setFloat64(0,n);return v.getBigUint64(0).toString(16).padStart(16,'0');};
for(const c of cases){const o=oracle.rows.find(r=>r.id===c.id),input=new Float64Array(c.positions),before=Buffer.from(input.buffer).toString('hex');try{
 if(o.status==='range-refusal'){assert.throws(()=>exact(input),{code:'MESH_VOLUME_NUMERIC_RANGE'});rows.push({id:c.id,status:'PASS',rangeRefusal:true});}
 else{const r=exact(input);assert.equal(bits(r.signedVolume),o.bits,c.id);assert(Object.isFrozen(r));assert.equal(r.triangles,c.positions.length/9);rows.push({id:c.id,status:'PASS',signedVolume:r.signedVolume,bits:o.bits});}
 assert.equal(Buffer.from(input.buffer).toString('hex'),before);
}catch(e){rows.push({id:c.id,status:'FAIL',error:{code:e.code||null,message:e.message,stack:e.stack}});}}
const controls=[];const check=(name,fn)=>{try{const data=fn();controls.push({name,status:'PASS',...(data?{data}:{})});}catch(e){controls.push({name,status:'FAIL',error:{code:e.code||null,message:e.message,stack:e.stack}});}};
check('strict typed finite/unshared/detached admission, exact options, workcap',()=>{
 for(const p of [[],{},new Float32Array(9),new Float64Array(8),new Float64Array([0,0,0,0,0,0,0,NaN,0]),new Float64Array([0,0,0,0,0,0,0,Infinity,0])])assert.throws(()=>exact(p),{code:'INVALID_MESH'});
 for(const options of [null,{extra:true},{maxTriangles:0},{maxTriangles:100001},{maxTriangles:1.5}])assert.throws(()=>exact(new Float64Array(9),options),{code:'INVALID_MESH'});
 let calls=0;assert.throws(()=>exact(new Float64Array(9),{get maxTriangles(){calls++;return 1}}),{code:'INVALID_MESH'});assert.equal(calls,0);
 assert.throws(()=>exact(new Float64Array(new SharedArrayBuffer(72))),{code:'INVALID_MESH'});
 const p=new Float64Array(9);structuredClone(p,{transfer:[p.buffer]});assert.throws(()=>exact(p),{code:'INVALID_MESH'});
 assert.throws(()=>exact(new Float64Array(900009)),{code:'RESOURCE_LIMIT'});assert.throws(()=>exact(new Float64Array(18),{maxTriangles:1}),{code:'RESOURCE_LIMIT'});
 const sub=new Float64Array(new Float64Array([9,6,0,0,0,1,0,0,0,1,9]).buffer,8,9);assert.equal(exact(sub).signedVolume,1);
});
check('known common-anchor separated-shell cancellation is corrected, not guessed into components',()=>{
 const c=cases.find(r=>r.id==='separated-tiny-shell-counterexample'),input=new Float64Array(c.positions),o=oracle.rows.find(r=>r.id===c.id),old=local(input),r=exact(input);assert.notEqual(bits(old.signedVolume),o.bits);assert.equal(bits(r.signedVolume),o.bits);return{oldLocalEstimate:old.signedVolume,exactRoundedIntegral:r.signedVolume,cancellationSensitive:old.cancellationSensitive};
});
check('recorded translated tiny native mesh does not fix authored dimensional drift',()=>{
 const c=cases.find(r=>r.id==='recorded-native:tiny-large-origin'),r=exact(new Float64Array(c.positions));assert.equal(r.signedVolume,c.nativeVolume);assert.notEqual(r.signedVolume,6e-18);return{scope:'Represented integral versus requested dimensions, not a precision repair',exactRoundedIntegral:r.signedVolume,nativeVolume:c.nativeVolume,requestedProduct:6e-18};
});
const benchmarks=[];
if(workerData?.benchmark){
 const max=Number.MAX_VALUE,heavy=[max,max/2,max/4,max/3,max/5,max/7,max/11,max/13,max/17],reverse=[...heavy.slice(0,3),...heavy.slice(6,9),...heavy.slice(3,6)];
 for(const mode of ['simple-100k','recorded-box-coordinates-100k','adversarial-exponents-100k']){
  const input=new Float64Array(900000);
  if(mode==='simple-100k'){for(let i=0;i<100000;i++)input.set([6,0,0,0,1,0,0,0,1],i*9);}
  else if(mode==='recorded-box-coordinates-100k'){const p=cases.find(r=>r.id==='recorded-native:ordinary-translated').positions;for(let i=0;i<8333;i++)input.set(p,i*108);}
  else{for(let i=0;i<99998;i++)input.set(i%2?reverse:heavy,i*9);input[99998*9]=Number.MIN_VALUE;input[99999*9]=Number.MIN_VALUE;}
  const beforeMemory=process.memoryUsage(),start=performance.now();let result,error;
  try{result=exact(input);}catch(e){error={code:e.code||null,message:e.message};}
  const elapsedMs=performance.now()-start,afterMemory=process.memoryUsage();
  if(!error)assert.equal(result.signedVolume,mode==='simple-100k'?100000:mode==='recorded-box-coordinates-100k'?8333*4301:0);
  benchmarks.push({mode,triangles:100000,payloadBytes:input.byteLength,elapsedMs,result,error:error||null,processMemoryBefore:beforeMemory,processMemoryAfter:afterMemory,memoryScope:'rss is whole-process; heap/external/arrayBuffers are this Worker isolate snapshots. Not allocation peak/bound or OS-reclamation proof'});
 }
}
parentPort.postMessage({status:rows.every(r=>r.status==='PASS')&&controls.every(r=>r.status==='PASS')&&benchmarks.every(r=>!r.error)?'PASS':'FAIL',scope:'Actual NodeWorker exact represented-coordinate integration and arithmetic controls, no closure/native validity claim',rows,controls,benchmarks});
