import ociWorker from 'codi-oci-verified-worker';
import occJs from 'codi-occ-portable';
import occWasm from 'codi-occ-wasm';
import planModule from 'codi-enclosure-plan-module';
import meshModule from 'codi-enclosure-mesh-module';
import manufacturingModule from 'codi-enclosure-manufacturing-module';
import contactModule from 'codi-enclosure-contact-module';
import {createVerifiedOciMount} from 'engine/mount/oci-verified-mount.mjs';
import {resolveManufacturingAssignments} from '../projectManager/manufacturingMetadata.mjs';
import {readManufacturingEnclosurePair} from './enclosureManufacturingRead.mjs';
import {writeCore3mf} from './core3mf.mjs';
import {validateEnclosureBuildGroups} from './enclosureBuildGroups.mjs';
import physicalWorkerUrl from 'codi-physical-parameters-worker';
import {evaluatePhysicalInWorker} from '../parameters/physicalWorkerClient.mjs';
import {physicalBindingFields} from '../parameters/physicalBindingFields.mjs';
function path(asset:string){const u=new URL(asset,location.href);if(u.origin!==location.origin||u.search||u.hash)throw Error('Invalid manufacturing asset');return u.pathname;}
// V2 preserves the authored lid/label group only with native interface proof.
export async function workerEnclosure3mf({envelope,bodies,isCurrent,signal}:{envelope:any,bodies:any[],isCurrent:()=>boolean,signal?:AbortSignal}) {
 const check=()=>{if(signal?.aborted||!isCurrent())throw new DOMException('Manufacturing model changed','AbortError');};
 check();const metadata=envelope.manufacturing,history=envelope.project.model.history;
 if(metadata?.unit!=='millimeter')throw Error('Manufacturing requires millimeter units');
 const assigned=resolveManufacturingAssignments(metadata,history,bodies,metadata.revision),used=new Set(assigned.flatMap(o=>o.regions.map(r=>r.body)));
 if(!bodies.length||bodies.some(body=>!used.has(body))||assigned.length>16)throw Error('Every supported body must have a manufacturing assignment');
 validateEnclosureBuildGroups(metadata,assigned);
 // The envelope and its source were captured together by the guarded host
 // save preparation. Resolve typed authored fields in the same pinned Worker
 // used by modeling; never coerce names or consult the live scalar table.
 if(!Array.isArray(history)||history.length>256)throw Error('Enclosure history exceeds the export limit');
 const source=envelope.project.model.expressions??'',resolved=new Map<number,any>();
 if(typeof source!=='string'||source.length>131072)throw Error('Invalid manufacturing parameter source');
 if(source.startsWith('codi-physical-parameters:')){
  const targets:any[]=[];history.forEach((op,index)=>{if(!['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(op?.type))return;const fields=Object.create(null),keys=physicalBindingFields[op.type],featureId=Number(op.params?.featureId);if(!Number.isSafeInteger(featureId)||featureId<1)throw Error('Invalid enclosure feature identity');for(const key of keys){const d=Object.getOwnPropertyDescriptor(op.params,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Missing enclosure field');fields[key]=d.value;}targets.push({kind:'feature',index,featureId,type:op.type,fields});});
  const response=await evaluatePhysicalInWorker(path(physicalWorkerUrl),source,{signal,valid:isCurrent,manifest:{version:1,targets}});check();
  if(!response?.ok)throw Object.assign(new Error(response?.error?.message||'Manufacturing parameter evaluation failed'),{code:response?.error?.code,...(response?.error?.parameter?{parameter:response.error.parameter}:{})});
  for(const item of response.bindings.targets)resolved.set(item.index,item.fields);
 }
 const workerUrl=path(ociWorker),dir=workerUrl.slice(0,workerUrl.lastIndexOf('/')+1);
 for(const asset of [planModule,meshModule,manufacturingModule,contactModule]){const p=path(asset);if(p.slice(0,p.lastIndexOf('/')+1)!==dir)throw Error('Manufacturing worker modules are not colocated');}
 const cache=new Map(),objects=[],builds=[],materials=[],pairs=new Map();
 for(const object of assigned){
  const groupObjects=[];
  for(const region of object.regions){
  const binding=metadata.bindings.find(b=>b.id===region.bodyId),body=region.body,version=binding?.operationType==='WORKER_ENCLOSURE_V2'?2:1;
  if(!['WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'].includes(binding?.operationType)||body.ext?.workerGeometry?.engine!=='occ')throw Error('This manufacturing adapter requires an OCC enclosure');
  let parts=cache.get(binding.featureId);
  if(!parts){
   const matches=history.map((op,index)=>({op,index})).filter(item=>item.op.type===binding.operationType&&Number(item.op.params?.featureId)===binding.featureId);
   if(matches.length!==1)throw Error('Enclosure history is missing or ambiguous');
   const p=source.startsWith('codi-physical-parameters:')?resolved.get(matches[0].index):matches[0].op.params;
   if(!p)throw Error('Enclosure parameter bindings are unavailable');
   const plan:any={unit:'millimeter',width:p.width,length:p.length,height:p.height,wall:p.wall,clearance:p.clearance,lidThickness:p.lidThickness,lipDepth:p.lipDepth};
   if(version===2)plan.label={width:p.labelWidth,length:p.labelLength,depth:p.labelDepth};
   parts=await readManufacturingEnclosurePair({plan,version,isCurrent,signal,createMount:()=>createVerifiedOciMount({workerUrl,jsPath:path(occJs),wasmPath:path(occWasm),timeoutMs:30000})});check();cache.set(binding.featureId,parts);
  }
  const mesh=parts[binding.outputRole],material=metadata.materials.find(m=>m.id===region.materialId),appearance=metadata.appearances.find(a=>a.id===region.appearanceId);
  if(!mesh||!material||!appearance)throw Error('Assign material and appearance to every region');
  const pair=JSON.stringify([material.id,appearance.id]);
  if(!pairs.has(pair)){const id='material-'+pairs.size;pairs.set(pair,id);materials.push({id,name:material.name,color:appearance.color});}
  const l=body.location,identity=[1,0,0,0,1,0,0,0,1,0,0,0];
  if(!l||[l.mxx,l.myx,l.mzx,l.mxy,l.myy,l.mzy,l.mxz,l.myz,l.mzz,l.tx,l.ty,l.tz].some((v,i)=>v!==identity[i]))throw Error('Moved enclosure bodies are not supported by this export');
  const id='region-'+objects.length;
  objects.push({id,name:region.id,materialId:pairs.get(pair),vertices:Array.from({length:mesh.vertices.length/3},(_,i)=>Array.from(mesh.vertices.slice(i*3,i*3+3))),triangles:Array.from({length:mesh.triangles.length/3},(_,i)=>Array.from(mesh.triangles.slice(i*3,i*3+3))),transform:[...region.transform]});
  groupObjects.push(id);check();
  }
  builds.push({id:object.id,name:object.name,objects:groupObjects});
 }
 const bytes=await writeCore3mf({unit:'millimeter',revision:metadata.revision,materials,objects,builds},{signal});check();return bytes;
}
