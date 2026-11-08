// PRIVATE owner-issued batch, never a public JSON/artifact admission API.
import {captureManufacturingMetadata} from '../../../../modules/engine/mount/ownedManufacturingMeshProtocol.mjs';
import {captureManufacturingConstruction} from '../../../../modules/engine/solid/rectilinearConstructionWitness.mjs';
const issued=new WeakMap();
const fail=(message,code='INVALID_RESPONSE')=>{throw Object.assign(Error(message),{code});};
export const MANUFACTURING_REPLAY_LIMITS=Object.freeze({bytes:8388608,vertices:150000,triangles:250000,artifacts:32});
export const MANUFACTURING_REPLAY_CONTROLS=Object.freeze({linearDeflectionMm:.01,angularDeflectionRadians:.1,relative:false,maxVertices:150000,maxTriangles:100000});
const byteLength=Function.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get);
export function admitManufacturingReplayArtifacts(artifacts,bodies,engineRevision){
 if(!Array.isArray(artifacts)||artifacts.length<1||artifacts.length>32||artifacts.length!==bodies.length||Reflect.ownKeys(artifacts).length!==artifacts.length+1)fail('Invalid controlled artifact batch.');
 const used=new Set();let bytes=0,vertices=0,triangles=0;
 for(let i=0;i<artifacts.length;i++){
  const r=artifacts[i],body=bodies[i];
  const hasConstruction=!!r&&Object.hasOwn(r,'sourceConstruction');
  if(!r||Reflect.ownKeys(r).sort().join(',')!==(hasConstruction?'body,buffer,contractVersion,engine,engineRevision,metadata,op,sourceConstruction,unit':'body,buffer,contractVersion,engine,engineRevision,metadata,op,unit')||r.op!=='solid.manufacturing.mesh.read'||r.contractVersion!==1||r.unit!=='millimeter'||r.engine!=='occ'||r.engineRevision!==engineRevision||r.body?.bodyId!==body.bodyId||r.body?.featureId!==body.featureId)fail('Controlled artifact source binding changed.');
  if(hasConstruction){const d=Object.getOwnPropertyDescriptor(r,'sourceConstruction');if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Construction witness must be own data.');captureManufacturingConstruction(d.value,{bodyId:body.bodyId,featureId:body.featureId,engine:'occ',engineRevision});}
  const m=captureManufacturingMetadata(r.metadata,MANUFACTURING_REPLAY_CONTROLS);let size;try{size=byteLength(r.buffer);new DataView(r.buffer);}catch{fail('Expected attached standalone controlled mesh.');}
  if(used.has(r.buffer)||size!==m.byteLength)fail('Controlled mesh buffer is aliased or changed.');used.add(r.buffer);bytes+=size;vertices+=m.vertexCount;triangles+=m.triangleCount;
  if(bytes>8388608||vertices>150000||triangles>250000)fail('Controlled mesh batch exceeds its budget.','RESOURCE_LIMIT');
 }
 return Object.freeze({bytes,vertices,triangles});
}
export function issueWorkerManufacturingMeshes(data,requireCurrent){
 requireCurrent();admitManufacturingReplayArtifacts(data.artifacts,data.bodies,data.engineRevision);requireCurrent();
 const token=Object.freeze({});issued.set(token,{data:Object.freeze(data),requireCurrent});return token;
}
export function consumeWorkerManufacturingMeshes(token){
 const entry=issued.get(token);if(!entry)fail('Unknown or consumed manufacturing preparation.','INVALID_PREPARATION');issued.delete(token);
 entry.requireCurrent();admitManufacturingReplayArtifacts(entry.data.artifacts,entry.data.bodies,entry.data.engineRevision);entry.requireCurrent();return entry.data;
}
// Idempotently abandon an unconsumed batch without touching any model owner.
export function discardWorkerManufacturingMeshes(token){issued.delete(token);}
// Called only inside the existing exclusive observation evaluator; it owns
// cleanup. This function neither creates nor accepts an evaluation owner.
export async function readManufacturingReplayBatch({owner,registry,engine,engineRevision,bodies,valid},read){
 if(typeof read!=='function'||!Array.isArray(bodies)||!Object.isFrozen(bodies)||bodies.length<1||bodies.length>32||Reflect.ownKeys(bodies).length!==bodies.length+1)fail('Invalid manufacturing replay batch.','INVALID_REQUEST');
 const current=()=>{owner.requireObservationOnly();owner.requireCurrent();if(valid()!==true)throw new DOMException('Manufacturing replay changed.','AbortError');owner.requireCurrent();owner.requireObservationOnly();};
 let vertices=0,triangles=0,bytes=0;const artifacts=[];
 for(const body of bodies){
  current();
  const maxVertices=150000-vertices,maxTriangles=Math.min(100000,250000-triangles);if(maxVertices<1||maxTriangles<1)fail('Manufacturing aggregate budget exhausted.','RESOURCE_LIMIT');
  const controls=Object.freeze({...MANUFACTURING_REPLAY_CONTROLS,maxVertices,maxTriangles});
  const artifact=await read({owner,registry,engine,engineRevision,body,controls,valid});
  current();
  const metadata=captureManufacturingMetadata(artifact.metadata,controls);vertices+=metadata.vertexCount;triangles+=metadata.triangleCount;bytes+=metadata.byteLength;if(bytes>8388608||vertices>150000||triangles>250000)fail('Manufacturing aggregate budget exceeded.','RESOURCE_LIMIT');artifacts.push(artifact);
 }
 admitManufacturingReplayArtifacts(artifacts,bodies,engineRevision);return Object.freeze(artifacts);
}
