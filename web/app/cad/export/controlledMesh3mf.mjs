// Worker-only adapter. Native membership comes from protected issued replay;
// constructed region interfaces and every embedded mesh are checked here.
import {writeCore3mf} from './core3mf.mjs';
import {decodeManufacturingMesh} from '../../../../modules/engine/mount/manufacturingMeshRecord.mjs';
import {captureControlled3mf,expectedMapping,CONTROLS,small,fail} from './controlledMesh3mfProtocol.mjs';
import {captureFullFaceBoxInterface} from './alignedBoxRegionInterface.mjs';
import {captureInsetPocketInterface} from './insetPocketRegionInterface.mjs';

export async function encodeControlledMesh3mf(input,{signal,onProgress=undefined}={}){
 const c=captureControlled3mf(input),r=c.request;
 const cancelled=()=>{if(signal&&Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(signal))throw new DOMException('3MF encoding cancelled','AbortError');};cancelled();
 if(r.parts.some(p=>p.regions.length>2))fail('Only bounded two-region material interfaces are supported','UNQUALIFIED_REGION_INTERFACE');
 const mats=new Map(r.materials.map(x=>[x.id,x])),apps=new Map(r.appearances.map(x=>[x.id,x]));
 for(const p of r.parts)for(const z of p.regions)if(!mats.has(z.materialId)||!apps.has(z.appearanceId))fail('Choose a known material and appearance for every region','UNKNOWN_MATERIAL_ASSIGNMENT');
 const mapping=expectedMapping(r),byBody=new Map(r.artifacts.map(x=>[x.body.bodyId,x]));
 const materials=mapping.materialPairs.map(p=>({id:p.id,name:mats.get(p.materialId).name,color:apps.get(p.appearanceId).color})),objects=[],builds=[];
 for(const p of mapping.parts){
  cancelled();const regions=[];
  for(const z of p.regions){
   const a=byBody.get(z.bodyId);
   try{decodeManufacturingMesh(a.buffer,a.metadata,CONTROLS);}catch(cause){throw Object.assign(Error('Controlled binary validation refused'),{code:'INVALID_MESH_ARTIFACT',cause});}
   const v=new DataView(a.buffer),vertices=Array.from({length:a.metadata.vertexCount},(_,i)=>[0,1,2].map(j=>v.getFloat64(a.metadata.positionsOffset+i*24+j*8,true))),triangles=Array.from({length:a.metadata.triangleCount},(_,i)=>[0,1,2].map(j=>v.getUint32(a.metadata.indicesOffset+i*12+j*4,true)));
   const pair=mapping.materialPairs.find(p=>p.materialId===z.materialId&&p.appearanceId===z.appearanceId);
   objects.push({id:z.objectId,name:z.id,materialId:pair.id,vertices,triangles});
   regions.push({...z,sourceConstruction:a.sourceConstruction,vertices,triangles});
  }
  // No cross-region intersection exception is handed to the writer. Each
  // region remains a full closed mesh and receives all existing exact checks.
  // Only this explicit construction domain proves allowed cross-region contact.
  if(regions.length===2){
   if(regions.every(r=>r.sourceConstruction?.kind==='authored-axis-aligned-box'))await captureFullFaceBoxInterface({partId:p.id,regions},{signal});
   else await captureInsetPocketInterface({partId:p.id,regions},{signal});
  }
  builds.push({id:p.id,name:p.name,objects:p.regions.map(z=>z.objectId)});
 }
 let output;
 try{output=await writeCore3mf({unit:'millimeter',revision:r.revision,materials,objects,builds},{signal,provenance:{version:1,revision:r.revision,...mapping},onMeshProgress:onProgress});}
 catch(cause){
  let name=null;try{name=Object.getOwnPropertyDescriptor(DOMException.prototype,'name').get.call(cause);}catch{}
  if(name==='AbortError'||name==='TimeoutError')throw cause;
  const descriptor=cause&&typeof cause==='object'?Object.getOwnPropertyDescriptor(cause,'code'):null;
  if(descriptor&&Object.hasOwn(descriptor,'value')&&['RESOURCE_LIMIT','ENCODER_CLEANUP_FAILED'].includes(descriptor.value))throw cause;
  if(signal&&Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(signal))throw Object.assign(new DOMException('3MF encoding cancelled','AbortError'),{cause});
  throw Object.assign(Error('3MF mesh/domain validator refused'),{code:'UNSUPPORTED_MESH_DOMAIN',cause});
 }
 cancelled();if(output.byteLength>67108864)fail('3MF output exceeds encoder budget','RESOURCE_LIMIT');
 const buffer=output.byteOffset===0&&output.byteLength===output.buffer.byteLength?output.buffer:output.slice().buffer;
 return {...small({version:1,unit:'millimeter',format:'3mf-core',mime:'model/3mf',revision:r.revision,byteLength:buffer.byteLength,...mapping}),buffer};
}
