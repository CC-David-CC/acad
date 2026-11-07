import {createVerifiedOciMount} from 'engine/mount/oci-verified-mount.mjs';
import {enclosurePlan,enclosurePlanV2} from 'engine/mount/enclosurePlan.mjs';
import {MWorkerEnclosureBody} from 'cad/model/mworkerEnclosure';
const invalid=(message:string)=>Object.assign(new Error(message),{code:'INVALID_REQUEST'});
const aborted=()=>new DOMException('Enclosure was cancelled or superseded.','AbortError');
function capture(value:any,keys:string[]){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw invalid('Invalid enclosure input.');
 const out:any={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw invalid('Enclosure input must use data properties.');out[key]=d.value;}return out;
}
function snapshotModel(model:MWorkerEnclosureBody){
 const id=model.id,role=model.outputRole,featureId=model.featureId,ext=model.ext,tag=ext.workerGeometry,csys=model.csys,location=model.location$,matrix=location.value;
 const vectors=['origin','x','y','z'].map(key=>{const v=(csys as any)[key];return [v.x,v.y,v.z];});
 const names=['mxx','mxy','mxz','tx','myx','myy','myz','ty','mzx','mzy','mzz','tz'],values=names.map(k=>(matrix as any)[k]);
 const positions=model.copyDisplayPositions(),copyMethod=model.copyDisplayPositions;
 const faces=model.faces,edges=model.edges,vertices=model.vertices;
 return ()=>{
  if(model.id!==id||model.outputRole!==role||model.featureId!==featureId||model.ext!==ext||ext.workerGeometry!==tag||model.csys!==csys||model.location$!==location||location.value!==matrix||model.copyDisplayPositions!==copyMethod||model.faces!==faces||model.edges!==edges||model.vertices!==vertices||faces.length||edges.length||vertices.length)throw Error('Enclosure projection changed.');
  for(let i=0;i<4;i++){const v=(csys as any)[['origin','x','y','z'][i]];if(!v||[v.x,v.y,v.z].some((x,j)=>!Object.is(x,vectors[i][j])))throw Error('Enclosure coordinate frame changed.');}
  if(names.some((key,i)=>!Object.is((matrix as any)[key],values[i])))throw Error('Enclosure placement changed.');
  const current=model.copyDisplayPositions();if(current.length!==positions.length||current.some((v,i)=>!Object.is(v,positions[i])))throw Error('Enclosure display projection changed.');
 };
}
export async function runWorkerEnclosure(input:any){
 const keys=['evaluation','featureId','plan','occupiedIds','assets','valid'];if(input&&Object.prototype.hasOwnProperty.call(input,'signal'))keys.push('signal');if(input&&Object.prototype.hasOwnProperty.call(input,'version'))keys.push('version');
 const a=capture(input,keys),owner=a.evaluation,assets=capture(a.assets,['workerUrl','jsPath','wasmPath']);
 if(!owner||typeof owner.requireCurrent!=='function'||typeof owner.getOrCreateMount!=='function'||typeof owner.close!=='function'||!owner.signal||typeof a.valid!=='function'||!Number.isSafeInteger(a.featureId)||a.featureId<=0||!(a.occupiedIds instanceof Set)||a.occupiedIds.size>16384)throw invalid('Invalid enclosure candidate.');
 for(const signal of [owner.signal,a.signal].filter(Boolean)){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted')!.get!.call(signal);}catch{throw invalid('Invalid cancellation signal.');}}
 const version=a.version===undefined?1:a.version;if(version!==1&&version!==2)throw invalid('Unsupported enclosure version.');const planKeys=['unit','width','length','height','wall','clearance','lidThickness','lipDepth'];if(version===2)planKeys.push('label');const plan=capture(a.plan,planKeys);if(version===2){plan.label=capture(plan.label,['width','length','depth']);enclosurePlanV2(plan);}else enclosurePlan(plan);
 for(const key of ['workerUrl','jsPath','wasmPath'])if(typeof assets[key]!=='string'||!assets[key].startsWith('/')||assets[key].startsWith('//'))throw invalid('Invalid same-origin worker asset.');
 const roles=version===2?['BODY','LID','LABEL']:['BODY','LID'];const ids=roles.map(role=>'worker-enclosure:'+version+':'+JSON.stringify([a.featureId,role]));for(const id of ids)if(a.occupiedIds.has(id))throw invalid('An enclosure output ID already exists.');
 const valid=()=>{try{return owner.state==='candidate'&&!owner.signal.aborted&&!a.signal?.aborted&&a.valid()===true}catch{return false}};
 const current=()=>{owner.requireCurrent();if(!valid())throw aborted();owner.requireCurrent();};
 const controller=new AbortController(),stop=()=>controller.abort();for(const signal of [owner.signal,a.signal].filter(Boolean))signal.addEventListener('abort',stop,{once:true});
 let mount:any;try{
  current();mount=owner.getOrCreateMount('occ-enclosure-v1:'+a.featureId,()=>createVerifiedOciMount({...assets,timeoutMs:30000}));
  await new Promise<void>((resolve,reject)=>{
   const onAbort=()=>{cleanup();reject(aborted());};
   const cleanup=()=>controller.signal.removeEventListener('abort',onAbort);
   if(controller.signal.aborted){reject(aborted());return;}
   controller.signal.addEventListener('abort',onAbort,{once:true});
   Promise.resolve(mount.ready).then(()=>{cleanup();resolve();},error=>{cleanup();reject(error);});
  });current();
  let result;try{result=await mount.createEnclosure({op:'solid.enclosure.create',version,plan},{signal:controller.signal});}catch(e){if(e?.code==='RESOURCE_LIMIT')throw Object.assign(new Error('Enclosure after another worker feature is not supported yet.'),{code:'UNSUPPORTED_FEATURE_ORDER'});throw e;}current();
  if(result?.body?.role!=='BODY'||result?.lid?.role!=='LID'||!result.body.handle||!result.lid.handle||(version===2&&(result.label?.role!=='LABEL'||!result.label.handle))||typeof mount.assertEnclosureBinding!=='function')throw Error('Invalid enclosure pair.');
  const body=await mount.readEnclosureMesh({op:'solid.enclosure.mesh',version:1,handle:result.body.handle},{signal:controller.signal});current();
  const lid=await mount.readEnclosureMesh({op:'solid.enclosure.mesh',version:1,handle:result.lid.handle},{signal:controller.signal});current();
  if(body?.role!=='BODY'||lid?.role!=='LID'||!(body.buffer instanceof ArrayBuffer)||!(lid.buffer instanceof ArrayBuffer))throw Error('Invalid enclosure meshes.');
  const label=version===2?await mount.readEnclosureMesh({op:'solid.enclosure.mesh',version:1,handle:result.label.handle},{signal:controller.signal}):null;current();if(version===2&&(label?.role!=='LABEL'||!(label.buffer instanceof ArrayBuffer)))throw Error('Invalid enclosure label mesh.');const models=[new MWorkerEnclosureBody(a.featureId,'BODY',new Float64Array(body.buffer),'occ',version),new MWorkerEnclosureBody(a.featureId,'LID',new Float64Array(lid.buffer),'occ',version),...(label?[new MWorkerEnclosureBody(a.featureId,'LABEL',new Float64Array(label.buffer),'occ',version)]:[])];
  if(models.some((model,i)=>model.id!==ids[i]))throw Error('Enclosure output identity changed.');
  const checks=models.map(snapshotModel);
  const publicationCheck=()=>{if(!valid())throw aborted();if(version===2)mount.assertEnclosureBinding(result.body.handle,result.lid.handle,result.label.handle);else mount.assertEnclosureBinding(result.body.handle,result.lid.handle);checks.forEach(check=>check());if(!valid())throw aborted();};
  const requireCurrent=()=>{owner.requireCurrent();publicationCheck();owner.requireCurrent();};requireCurrent();
  return Object.freeze({models:Object.freeze(models),publicationCheck,requireCurrent});
 }catch(error){if(mount)owner.close();throw error;}finally{for(const signal of [owner.signal,a.signal].filter(Boolean))signal.removeEventListener('abort',stop);}
}
