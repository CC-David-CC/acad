import {validateFourCornerHoleIntent} from './fourCornerHoleIntent.mjs';
import {captureCandidateDrilledProjection} from './candidateDrilledProjectionInvariant.mjs';
import {validateCenteredHoleIntent,validateCenteredHoleTarget} from './centeredHoleIntent.mjs';
import {captureCandidateProjection} from './candidateProjectionInvariant.mjs';

// Only the trusted candidate adapter and dependent operation use this module.
// Entries are per owner, never serialized, and never available from an accepted
// owner. Native state remains in the single evaluation-owned worker mount.
const owners=new WeakMap(), LIMIT=8, MOUNT_KEY='occ-prism-v1';
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_CANDIDATE_BINDING'});};
const stable=tuple=>'worker-prism:1:'+JSON.stringify(tuple);
function fields(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)fail('Invalid candidate binding.');
 const result=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Candidate binding must use data properties.');result[key]=d.value;}
 if(Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))fail('Unexpected candidate binding field.');return result;
}
function snapshotProfile(value){
 const p=fields(value,['version','unit','engine','revision','sketchDigest','faceId','regionId','frame','depth','sketchJSON']);
 if(![1,2].includes(p.version)||p.unit!=='millimeter'||p.engine!=='occ'||typeof p.revision!=='string'||!p.revision||p.revision.length>256||typeof p.sketchDigest!=='string'||!/^[a-f0-9]{64}$/.test(p.sketchDigest)||typeof p.sketchJSON!=='string'||p.sketchJSON.length>65536||!Number.isFinite(p.depth)||p.depth<=0||p.depth>1e6)fail('Invalid captured source profile.');
 const frame=fields(p.frame,['origin','x','y','z']);for(const key of ['origin','x','y','z']){const a=frame[key];if(!Array.isArray(a)||a.length!==3||Reflect.ownKeys(a).length!==4)fail('Invalid source frame.');frame[key]=Object.freeze([0,1,2].map(i=>{const d=Object.getOwnPropertyDescriptor(a,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='number'||!Number.isFinite(d.value)||Math.abs(d.value)>1e7)fail('Invalid source frame.');return d.value;}));}
 return Object.freeze({...p,frame:Object.freeze({...frame})});
}
function snapshotTopology(value){
 const seen=new Set(),budget={nodes:0,chars:0};
 function copy(v,depth){
  if(++budget.nodes>10000||depth>16)fail('Portable topology exceeds limits.');
  if(v===null||typeof v==='boolean')return v;
  if(typeof v==='number'){if(!Number.isFinite(v))fail('Portable topology is not finite.');return v;}
  if(typeof v==='string'){if((budget.chars+=v.length)>16384)fail('Portable topology exceeds limits.');return v;}
  if(!v||typeof v!=='object'||seen.has(v))fail('Portable topology must be a tree.');seen.add(v);
  const keys=Reflect.ownKeys(v);if(keys.some(k=>typeof k!=='string'))fail('Invalid portable topology.');
  if(Array.isArray(v)){if(v.length>192||keys.length!==v.length+1)fail('Portable topology array is not dense.');const out=[];for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Portable topology array is not dense.');out.push(copy(d.value,depth+1));}return out;}
  if(keys.length>32)fail('Portable topology exceeds limits.');const out=Object.create(null);for(const k of keys){const d=Object.getOwnPropertyDescriptor(v,k);if(k==='__proto__'||!d?.enumerable||!Object.hasOwn(d,'value')||(budget.chars+=k.length)>16384)fail('Invalid portable topology.');out[k]=copy(d.value,depth+1);}return out;
 }
 const result=copy(value,0);if(new TextEncoder().encode(JSON.stringify(result)).byteLength>16384)fail('Portable topology exceeds limits.');return result;
}
function snapshotHandle(value){const h=fields(value,['mountId','generation','representation','id']);if(typeof h.mountId!=='string'||!h.mountId||h.mountId.length>256||!Number.isSafeInteger(h.generation)||h.generation<1||h.representation!=='occ-brep-worker-owned'||typeof h.id!=='string'||!h.id||h.id.length>256)fail('Invalid worker handle.');return Object.freeze({...h});}
function owned(owner,mount){
 if(!owner||typeof owner.requireCurrent!=='function'||typeof owner.getOrCreateMount!=='function'||!owner.signal)fail('Candidate owner required.');
 owner.requireCurrent();const existing=owner.getOrCreateMount(MOUNT_KEY,()=>{throw Object.assign(new Error('Owner has no prism mount.'),{code:'INVALID_CANDIDATE_BINDING'});});
 if(existing!==mount||!mount||typeof mount.assertPortableBinding!=='function')fail('Mount does not belong to this candidate.');owner.requireCurrent();
}
function modelMatches(model,target){
 if(!model||typeof model!=='object'||model.id!==target.bodyId||model.ext?.workerGeometry?.representation!=='worker-owned-occ-prism'||model.ext.workerGeometry.engine!=='occ'||!Array.isArray(model.faces))fail('Projected parent body is unavailable.');
 const faces=model.faces.filter(face=>face?.id===target.lidFaceId);if(faces.length!==1||faces[0].root!==model)fail('Projected parent LID is ambiguous.');
 const key=fields(faces[0].topology?.data?.portableIdentity?.key,['featureId','kind','role','source']),source=fields(key.source,['regionId']);
 if(key.featureId!==target.parentFeatureId||key.kind!=='face'||key.role!=='LID'||source.regionId!==target.regionId)fail('Projected parent LID intent changed.');return faces[0];
}
function modelIdentities(model){
 if(typeof model.traverse!=='function')fail('Projected parent traversal is unavailable.');
 const ids=new Map();let count=0;
 model.traverse(object=>{
  if(++count>128||!object||typeof object!=='object')fail('Projected parent exceeds identity limits.');
  if(object.ext?.workerIdentity?.stability==='transient'||object.ext?.vertexIdentity?.stability==='transient'||object.topology?.data?.portableIdentity?.stability==='transient')return;
  const id=object.id;if(typeof id!=='string'||!id||id.length>1024)fail('Invalid durable worker identity.');
  if(ids.has(id)&&ids.get(id)!==object)fail('Duplicate durable worker identity.');ids.set(id,object);
 });
 return ids;
}
function sameIdentities(a,b){if(a.size!==b.size)return false;for(const [id,object] of a)if(b.get(id)!==object)return false;return true;}
function validateRecord(owner,record){
 owned(owner,record.mount);validateRecordState(owner,record);owner.requireCurrent();validateRecordState(owner,record);
}
// Does not call owner.requireCurrent: publication callbacks run inside it.
function validateRecordState(owner,record){
 if(owners.get(owner)!==record.ledger||owner.signal.aborted)fail('Candidate association is no longer current.');
 record.checkProjection();modelMatches(record.model,record.target);if(!sameIdentities(record.identities,modelIdentities(record.model)))fail('Projected parent identities changed.');
 record.mount.assertPortableBinding(record.handle,record.binding,record.topology);
 if(owners.get(owner)!==record.ledger||owner.signal.aborted)fail('Candidate association is no longer current.');
}
function scrub(record){record.identities.clear();record.mount=null;record.model=null;record.handle=null;record.profile=null;record.binding=null;record.topology=null;record.target=null;record.checkProjection=null;}
export function registerCandidatePrism({owner,mount,model,featureId,profile,handle,topology}){
 owned(owner,mount);if(typeof featureId!=='string'||!featureId||featureId.length>256)fail('Invalid authored feature identity.');
 const source=snapshotProfile(profile),h=snapshotHandle(handle),bodyId=stable([featureId,'body']),lidFaceId=stable([featureId,'face','LID',{regionId:source.regionId}]);
 const target=validateCenteredHoleTarget({parentFeatureId:featureId,bodyId,lidFaceId,regionId:source.regionId});
 if(JSON.parse(source.regionId.slice('sketch-region:'.length)).faceId!==source.faceId)fail('Captured region belongs to another face.');
 modelMatches(model,target);const identities=modelIdentities(model),checkProjection=captureCandidateProjection(model);const binding=Object.freeze({revision:source.revision,sketchDigest:source.sketchDigest,faceId:source.faceId,regionId:source.regionId});
 const captured=snapshotTopology(topology);
 mount.assertPortableBinding(h,binding,captured);owner.requireCurrent();checkProjection();modelMatches(model,target);if(!sameIdentities(identities,modelIdentities(model)))fail('Projected parent identities changed.');
 let ledger=owners.get(owner);if(!ledger){ledger={features:new Map(),models:new Map(),holes:new Map(),keys:new Set(),abort:null};owners.set(owner,ledger);ledger.abort=()=>{if(owners.get(owner)===ledger){for(const entry of ledger.features.values())scrub(entry);ledger.features.clear();ledger.models.clear();ledger.holes.clear();ledger.keys.clear();owners.delete(owner);}};owner.signal.addEventListener('abort',ledger.abort,{once:true});}
 owner.requireCurrent();if(owner.signal.aborted||owners.get(owner)!==ledger)fail('Candidate association is no longer current.');
 if(ledger.features.size>=LIMIT||ledger.features.has(featureId)||ledger.models.has(model)||[...identities.keys()].some(id=>ledger.keys.has(id)))fail('Duplicate or excessive candidate semantic key.');
 const record={ledger,mount,model,handle:h,profile:source,binding,topology:captured,target,identities,checkProjection};
 ledger.features.set(featureId,record);ledger.models.set(model,record);for(const id of identities.keys())ledger.keys.add(id);
 const discard=()=>{if(owners.get(owner)!==ledger||ledger.features.get(featureId)!==record)return;ledger.features.delete(featureId);ledger.models.delete(model);for(const id of identities.keys())ledger.keys.delete(id);scrub(record);if(!ledger.features.size){owner.signal.removeEventListener('abort',ledger.abort);owners.delete(owner);}};
 return Object.freeze({bodyId,lidFaceId,discard});
}
export function resolveCandidatePrism(owner,value){
 owner?.requireCurrent();const intent=validateCenteredHoleIntent(value),ledger=owners.get(owner),record=ledger?.features.get(intent.target.parentFeatureId);
 if(!record||ledger.models.get(record.model)!==record||record.target.bodyId!==intent.target.bodyId||record.target.lidFaceId!==intent.target.lidFaceId||record.target.regionId!==intent.target.regionId)fail('Candidate source intent is unavailable or changed.');
 validateRecord(owner,record);
 // The handle and mount never leave the candidate ledger. Dependent adapters
 // use executeCenteredHole rather than obtaining a native handle here.
 return Object.freeze({model:record.model,profile:record.profile,intent,requireCurrent:()=>validateRecord(owner,record)});
}

// Internal adapter boundary. Native handles stay here; only detached evidence
// and a synchronous publication guard can reach the model projection adapter.
export async function executeCenteredHole(owner,value,options){
 const {valid,signal}=fields(options,options&&Object.hasOwn(options,'signal')?['valid','signal']:['valid']);
 if(typeof valid!=='function')fail('A current document guard is required.');
 if(signal!==undefined){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(signal);}catch{fail('Invalid cancellation signal.');}}
 const resolved=resolveCandidatePrism(owner,value),intent=resolved.intent,record=owners.get(owner).features.get(intent.target.parentFeatureId),mount=record.mount;
 if(typeof mount.centeredThroughHole!=='function'||typeof mount.assertCenteredHoleBinding!=='function')fail('The current mount does not support centered holes.');
 if(record.cutPending)fail('A cut of this parent is already in progress.');
 const cancelled=()=>{throw new DOMException('Centered hole was cancelled or superseded.','AbortError');};
 const checkState=()=>{
  if(owner.state!=='candidate'||owner.signal.aborted||signal?.aborted)cancelled();
  if(valid()!==true)cancelled();
  validateRecordState(owner,record);
  if(valid()!==true)cancelled();
  if(owner.state!=='candidate'||owner.signal.aborted||signal?.aborted)cancelled();
 };
 const current=()=>{owner.requireCurrent();checkState();owner.requireCurrent();};
 current();record.cutPending=true;
 const controller=new AbortController(),stop=()=>controller.abort();
 for(const s of [owner.signal,signal].filter(Boolean))s.addEventListener('abort',stop,{once:true});
 try{
  current();
  const request={version:1,unit:'millimeter',...record.binding,diameter:intent.diameter};
  const result=await mount.centeredThroughHole({op:'solid.profile.centered-through-hole',version:1,parent:record.handle,request},{signal:controller.signal});
  current();
  if(result?.contractVersion!==1||result.op!=='solid.profile.centered-through-hole')fail('Invalid centered hole result.');
  const cutHandle=snapshotHandle(result.handle),binding=fields(result.binding,['unit','revision','sketchDigest','faceId','regionId','diameter']);
  for(const k of Object.keys(binding))if(binding[k]!==request[k])fail('Hole result is not bound to the requested source.');
  // The mount already enforces response bounds and data-only decoding.
  // Its private snapshot remains the oracle for mutation/currentness checks.
  const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
  const portableTopology=structuredClone(result.portableTopology),evidence=freeze(structuredClone(result.evidence)),parentTopology=freeze(structuredClone(record.topology));
  const publicationCheck=()=>{checkState();mount.assertCenteredHoleBinding(cutHandle,record.handle,binding,portableTopology);checkState();};
  const requireCurrent=()=>{current();publicationCheck();current();};
  requireCurrent();
  const bindProjection=model=>{
   requireCurrent();
   const ledger=owners.get(owner);
   if(!ledger||ledger.holes.has(intent.featureId)||ledger.holes.size>=LIMIT||!model||model.id!==intent.target.bodyId||model.ext?.workerGeometry?.representation!=='worker-owned-occ-drilled')fail('Invalid centered candidate projection.');
   const checkProjection=captureCandidateDrilledProjection(model);
   const wall=model.faces.filter(face=>face?.topology?.data?.portableIdentity?.key?.featureId===intent.featureId&&face.topology.data.portableIdentity.key.role==='HOLE_WALL');
   if(wall.length!==1||wall[0].root!==model)fail('Centered feature identity changed.');
   publicationCheck();checkProjection();publicationCheck();
   const hole={ledger,parent:record,mount,handle:cutHandle,binding,topology:portableTopology,model,intent,checkProjection,publicationCheck,pending:false};
   ledger.holes.set(intent.featureId,hole);
   return ()=>{if(owners.get(owner)===ledger&&ledger.holes.get(intent.featureId)===hole)ledger.holes.delete(intent.featureId);};
  };
  return Object.freeze({intent,profile:record.profile,parentModel:record.model,parentTopology,portableTopology,evidence,binding:Object.freeze(binding),publicationCheck,requireCurrent,bindProjection});
 }catch(error){owner.close();throw error;}finally{
  record.cutPending=false;
  for(const s of [owner.signal,signal].filter(Boolean))s.removeEventListener('abort',stop);
 }
}

// Candidate-only operation; native handles stay inside this owner-scoped ledger.
export async function executeFourCornerHoles(owner,value,options){
 const {valid,signal}=fields(options,options&&Object.hasOwn(options,'signal')?['valid','signal']:['valid']);
 if(typeof valid!=='function')fail('A current document guard is required.');
 if(signal!==undefined){try{Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get.call(signal);}catch{fail('Invalid cancellation signal.');}}
 const intent=validateFourCornerHoleIntent(value),ledger=owners.get(owner),hole=ledger?.holes.get(intent.centerFeatureId);
 if(!hole||hole.intent.featureId!==intent.centerFeatureId||hole.intent.target.parentFeatureId!==intent.target.parentFeatureId||hole.intent.target.bodyId!==intent.target.bodyId||hole.intent.target.lidFaceId!==intent.target.lidFaceId||hole.intent.target.regionId!==intent.target.regionId)fail('Centered parent feature does not match the authored target.');
 const mount=hole.mount;if(typeof mount.fourCornerThroughHoles!=='function'||typeof mount.assertFourCornerBinding!=='function')fail('The current mount does not support four-corner holes.');
 if(hole.pending)fail('A cut of this parent is already in progress.');
 const cancelled=()=>{throw new DOMException('Corner holes were cancelled or superseded.','AbortError');};
 const checkState=()=>{
  if(owner.state!=='candidate'||owner.signal.aborted||signal?.aborted||valid()!==true)cancelled();
  if(owners.get(owner)!==ledger||ledger.holes.get(intent.centerFeatureId)!==hole||ledger.features.get(intent.target.parentFeatureId)!==hole.parent)fail('Centered candidate is no longer current.');
  hole.publicationCheck();hole.checkProjection();hole.publicationCheck();
  if(owner.state!=='candidate'||owner.signal.aborted||signal?.aborted||valid()!==true)cancelled();
 };
 const current=()=>{owner.requireCurrent();checkState();owner.requireCurrent();};
 current();hole.pending=true;
 const controller=new AbortController(),stop=()=>controller.abort();
 for(const s of [owner.signal,signal].filter(Boolean))s.addEventListener('abort',stop,{once:true});
 try{
  current();
  const request={version:1,unit:'millimeter',featureId:intent.featureId,parentFeatureId:intent.target.parentFeatureId,centerFeatureId:intent.centerFeatureId,...hole.parent.binding,sideIds:intent.sideIds,offsetX:intent.offsetX,offsetY:intent.offsetY,diameter:intent.diameter};
  const result=await mount.fourCornerThroughHoles({op:'solid.profile.four-corner-through-holes',version:1,parent:hole.handle,request},{signal:controller.signal});
  current();
  if(result?.contractVersion!==1||result.op!=='solid.profile.four-corner-through-holes')fail('Invalid four-corner result.');
  const handle=snapshotHandle(result.handle),binding=fields(result.binding,['unit','revision','sketchDigest','faceId','regionId','featureId','parentFeatureId','centerFeatureId','sideIds','offsetX','offsetY','diameter','centerDiameter']);
  for(const k of ['unit','revision','sketchDigest','faceId','regionId','featureId','parentFeatureId','centerFeatureId','offsetX','offsetY','diameter'])if(binding[k]!==request[k])fail('Corner hole binding changed.');
  if(binding.centerDiameter!==hole.intent.diameter||JSON.stringify(binding.sideIds)!==JSON.stringify(intent.sideIds))fail('Corner hole source intent changed.');
  const topology=structuredClone(result.portableTopology),parentTopology=structuredClone(hole.topology),evidence=structuredClone(result.evidence);
  const publicationCheck=()=>{checkState();mount.assertFourCornerBinding(handle,hole.handle,binding,topology);checkState();};
  const requireCurrent=()=>{current();publicationCheck();current();};requireCurrent();
  return Object.freeze({intent,parentModel:hole.model,parentTopology,portableTopology:topology,evidence,binding,publicationCheck,requireCurrent});
 }catch(error){owner.close();throw error;}finally{hole.pending=false;for(const s of [owner.signal,signal].filter(Boolean))s.removeEventListener('abort',stop);}
}

// Exposes only the projected model and currentness, never the mount or handle.
export function resolveCandidateCenteredHole(owner,value){
 owner?.requireCurrent();
 const intent=validateFourCornerHoleIntent(value),ledger=owners.get(owner),hole=ledger?.holes.get(intent.centerFeatureId);
 if(!hole||hole.intent.target.parentFeatureId!==intent.target.parentFeatureId||hole.intent.target.bodyId!==intent.target.bodyId||hole.intent.target.lidFaceId!==intent.target.lidFaceId||hole.intent.target.regionId!==intent.target.regionId)fail('Centered parent feature does not match the authored target.');
 const requireCurrent=()=>{
  owner.requireCurrent();
  if(owner.state!=='candidate'||owner.signal.aborted||owners.get(owner)!==ledger||ledger.holes.get(intent.centerFeatureId)!==hole)fail('Centered candidate is no longer current.');
  hole.publicationCheck();hole.checkProjection();hole.publicationCheck();owner.requireCurrent();
 };
 requireCurrent();return Object.freeze({intent,model:hole.model,requireCurrent});
}
