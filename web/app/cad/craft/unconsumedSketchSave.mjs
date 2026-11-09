import {captureAuthoredCounterboreIntent} from '../../../../modules/engine/solid/authoredCounterboreIntent.mjs';
import {captureAuthoredBlindHoleIntent} from '../../../../modules/engine/solid/authoredBlindHoleIntent.mjs';
import {canonicalAuthoredFeatureId} from './authoredFeatureIdentity.mjs';
import {sourcePlaneFaceId} from './sourcePlaneIdentity.mjs';
import {captureSourceFrameParameters} from '../../../../modules/engine/source/sourceFrameIntent.mjs';
import {isAuthoredLength,captureAuthoredHoleIntent} from '../../../../modules/engine/solid/authoredLengthBinding.mjs';
import {captureOwnedLoftFeature} from '../../../../modules/engine/solid/ownedLoftFeature.mjs';
import {captureOwnedSweepFeature} from '../../../../modules/engine/solid/ownedSweepFeature.mjs';
// Explicit provenance allowlist; an unknown or implicit reference never advances the accepted tip.
import {captureOwnedRevolveFeature} from '../../../../modules/engine/solid/ownedRevolveFeature.mjs';
import {physicalBindingFields} from '../parameters/physicalBindingFields.mjs';
import {requireCadEngineBuild} from '../../../../modules/engine/mount/engineCatalog.mjs';
import {selectedProfileVersion} from '../../../../modules/engine/mount/selectedProfileBuildSelection.mjs';
import {solidBodyId,captureSolidEdgeTreatment} from '../../../../modules/engine/solid/solidIntent.mjs';
import {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost} from '../../../../modules/engine/solid/ownedLinearHolePatternIntent.mjs';
import {captureOwnedHoleIntent} from '../../../../modules/engine/solid/ownedHoleIntent.mjs';
const registrations=new WeakMap();
export function registerUnconsumedSketchSave(ctx,begin){if(!ctx||typeof begin!=='function'||registrations.has(ctx))throw Error('Invalid sketch save registration.');registrations.set(ctx,begin)}
export function beginUnconsumedSketchSave(ctx,face){return registrations.get(ctx)?.(face)||null}
const plain=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Reflect.ownKeys(v).some(k=>typeof k!=='string'||!keys.includes(k)))return false;return Object.keys(v).every(k=>{const d=Object.getOwnPropertyDescriptor(v,k);return d?.enumerable&&Object.hasOwn(d,'value')})};
const fid=v=>{try{return String(canonicalAuthoredFeatureId(v));}catch{return null;}};
const field=v=>typeof v==='string'&&v.length>0&&v.length<=8192;
const numberField=v=>typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length>0&&v.length<=128;
const semantic=v=>{if(typeof v!=='string'||v.length>1024||!v.startsWith('worker-prism:1:'))return null;try{const tuple=JSON.parse(v.slice(15));return Array.isArray(tuple)&&JSON.stringify(tuple)===v.slice(15)?tuple:null}catch{return null}};
const exactData=(value,keys)=>{if(Reflect.ownKeys(value).length!==keys.length)return null;const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))return null;out[key]=d.value;}return out;};
const genericCommon=data=>data&&data.version===1&&data.unit==='millimeter'&&Number.isSafeInteger(data.featureId)&&data.featureId>0&&typeof data.engine==='string'&&typeof data.engineRevision==='string'&&data.engineRevision.length===136;
// Only explicit, bounded feature ancestry can establish that this sketch is
// unrelated. Unknown schemas or ambiguous/generated identities refuse.
export function hasOnlyUnconsumedSketchHistory(history,faceId){
 if(!Array.isArray(history)||history.length>256||typeof faceId!=='string'||!faceId||faceId.length>1024)return false;
 // Historical IDs remain reserved after consumption. Only live generic outputs
 // can be Boolean operands; empty results retain the same source dependencies.
 const features=new Map(),sourceOwners=new Map(),liveGeneric=new Map();let genericBuild=null;
 const build=data=>{if(!genericCommon(data))return null;try{const spec=requireCadEngineBuild(data.engine,data.engineRevision);return spec.revision===data.engineRevision&&(!genericBuild||genericBuild.id===spec.id&&genericBuild.revision===spec.revision)?spec:null;}catch{return null;}};
 for(const item of history){if(!item||typeof item!=='object')return false;const pd=Object.getOwnPropertyDescriptor(item,'params'),td=Object.getOwnPropertyDescriptor(item,'type');if(!pd?.enumerable||!Object.hasOwn(pd,'value')||!td?.enumerable||!Object.hasOwn(td,'value')||!pd.value||typeof pd.value!=='object'||Array.isArray(pd.value))return false;const p=pd.value,fd=Object.getOwnPropertyDescriptor(p,'featureId');if(!fd?.enumerable||!Object.hasOwn(fd,'value'))return false;const id=fid(fd.value);if(!id||features.has(id))return false;
  if(item.type==='PLANE'){if(!plain(p,['featureId','orientation','depth','datum'])||p.datum!==undefined&&p.datum!==null||p.orientation!==undefined&&!['XY','XZ','ZY'].includes(p.orientation)||p.depth!==undefined&&!numberField(p.depth))return false;const sourceFace=sourcePlaneFaceId(canonicalAuthoredFeatureId(fd.value));features.set(id,{kind:'plane',sourceFace});sourceOwners.set(sourceFace,id);continue;}
  if(item.type==='SOURCE_FRAME_V1'){
   let data;try{data=captureSourceFrameParameters(p);}catch{return false;}
   if(data.parent?.kind==='native-planar-face'){
    const parent=data.parent,producer=fid(parent.featureId),originId=fid(parent.originFeatureId),origin=features.get(originId),target=liveGeneric.get(parent.bodyId),owner=origin&&features.get(origin.sourceOwner);
    // Structural causal proof only. The current candidate ledger separately
    // resolves this exact opaque face against actual owned Native topology.
    if(!producer||!originId||!features.has(producer)||!target||target.producer!==producer||target.build!==genericBuild||target.build.id!=='occ'||target.build.planarAttachmentVersion!==1||parent.engine!==target.build.id||parent.engineRevision!==target.build.revision||fid(parent.sourceFeatureId)!==originId||!target.origins?.has(originId)||!origin||origin.kind!=='selected-profile'||origin.build!==target.build||origin.sourceFace!==parent.sourceFaceId||origin.regionId!==parent.sourceRegionId||!owner||owner.kind!=='plane'||owner.sourceFace!==parent.sourceFaceId||!target.sources.has(parent.sourceFaceId))return false;
   }else if(data.parent&&features.get(String(data.parent.featureId))?.kind!=='plane')return false;
   const sourceFace=sourcePlaneFaceId(data.featureId);features.set(id,{kind:'plane',sourceFace});sourceOwners.set(sourceFace,id);continue;
  }
  if(item.type==='WORKER_ENCLOSURE_V1'||item.type==='WORKER_ENCLOSURE_V2'){const fields=physicalBindingFields[item.type];if(!plain(p,['featureId',...fields])||fields.some(k=>!numberField(p[k])))return false;features.set(id,{kind:'enclosure'});continue;}
  if(item.type==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'){
   const data=exactData(p,['version','unit','engine','engineRevision','featureId','faceId','regionId','depth','bodyPolicy']),spec=build(data);
   if(!spec||selectedProfileVersion(spec)===null||fid(data.featureId)!==id||typeof data.faceId!=='string'||!data.faceId||data.faceId.length>256||typeof data.regionId!=='string'||!data.regionId.startsWith('sketch-region:')||data.regionId.length>8192||!isAuthoredLength(data.depth)||data.bodyPolicy!=='separate'||data.faceId===faceId)return false;
   // Retaining the plane (consumed:[]) does not remove the source dependency.
   // Its edits require full atomic replay; only unrelated fast saves qualify.
   features.set(id,{kind:'selected-profile',build:spec,sourceFace:data.faceId,regionId:data.regionId,sourceOwner:sourceOwners.get(data.faceId)});liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set([data.faceId]),origins:new Set([id]),holeSource:data.featureId,seeds:new Set()});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_SELECTED_PROFILE_LOFT_V1'){
   let data;try{data=captureOwnedLoftFeature(p);}catch{return false;}const spec=build(data),sources=data.sections.map(section=>section.faceId);
   if(!spec||spec.loftVersion!==1||fid(data.featureId)!==id||sources.includes(faceId))return false;
   features.set(id,{kind:'loft',sourceFaces:Object.freeze(sources.slice())});liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set(sources),origins:new Set(),holeSource:null,seeds:new Set()});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_SELECTED_PROFILE_SWEEP_V1'){
   let data;try{data=captureOwnedSweepFeature(p);}catch{return false;}const spec=build(data);
   if(!spec||spec.sweepVersion!==1||fid(data.featureId)!==id||data.faceId===faceId||data.pathFaceId===faceId)return false;
   features.set(id,{kind:'sweep',sourceFace:data.faceId,pathFace:data.pathFaceId,regionId:data.regionId});liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set([data.faceId,data.pathFaceId]),origins:new Set(),holeSource:null,seeds:new Set()});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_SELECTED_PROFILE_REVOLVE_V1'){
   let data;try{data=captureOwnedRevolveFeature(p);}catch{return false;}const spec=build(data);
   if(!spec||spec.revolveVersion!==1||fid(data.featureId)!==id||data.faceId===faceId)return false;
   features.set(id,{kind:'revolve',sourceFace:data.faceId,regionId:data.regionId});liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set([data.faceId]),origins:new Set(),holeSource:null,seeds:new Set()});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_SOLID_BOX_V1'){
   const data=exactData(p,['version','unit','engine','engineRevision','featureId','x','y','z','width','depth','height']),spec=build(data);
   if(!spec||fid(data.featureId)!==id||['x','y','z'].some(k=>typeof data[k]!=='number'||!Number.isFinite(data[k])||Math.abs(data[k])>1e6)||['width','depth','height'].some(k=>typeof data[k]!=='number'||!Number.isFinite(data[k])||data[k]<=0||data[k]>1e6))return false;
   features.set(id,{kind:'generic-box'});liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set(),origins:new Set()});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_SOLID_BOOLEAN_V1'){
   const data=exactData(p,['version','unit','engine','engineRevision','featureId','kind','a','b']),spec=build(data);
   if(!spec||fid(data.featureId)!==id||!['union','join','subtract','common'].includes(data.kind)||[data.a,data.b].some(value=>typeof value!=='string'||!value||value.length>1024)||data.a===data.b)return false;
   const a=liveGeneric.get(data.a),b=liveGeneric.get(data.b);
   if(!a||!b||a.build!==spec||b.build!==spec)return false;
   const sources=new Set([...a.sources,...b.sources]);if(sources.has(faceId))return false;
   liveGeneric.delete(data.a);liveGeneric.delete(data.b);liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources,origins:new Set([...a.origins,...b.origins])});features.set(id,{kind:'generic-boolean'});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_CENTERED_COUNTERBORE_V1'){
   let data;try{data=captureAuthoredCounterboreIntent(p);}catch{return false;}const spec=build(data),parent=liveGeneric.get(data.target),source=features.get(fid(data.sourceFeatureId));
   if(!spec||spec.counterboreVersion!==1||fid(data.featureId)!==id||!parent||parent.build!==spec||parent.producer!==fid(data.producerFeatureId)||!source||source.kind!=='selected-profile'||parent.producer!==fid(data.sourceFeatureId)||source.sourceFace!==data.sourceFaceId||source.regionId!==data.sourceRegionId||!parent.sources.has(data.sourceFaceId)||parent.sources.has(faceId))return false;
   liveGeneric.delete(data.target);liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set(parent.sources),origins:new Set(parent.origins)});features.set(id,{kind:'generic-counterbore'});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_CENTERED_BLIND_HOLE_V1'){
   let data;try{data=captureAuthoredBlindHoleIntent(p);}catch{return false;}const spec=build(data),parent=liveGeneric.get(data.target),source=features.get(fid(data.sourceFeatureId));
   if(!spec||spec.blindHoleVersion!==1||fid(data.featureId)!==id||!parent||parent.build!==spec||parent.producer!==fid(data.producerFeatureId)||!source||source.kind!=='selected-profile'||parent.producer!==fid(data.sourceFeatureId)||source.sourceFace!==data.sourceFaceId||source.regionId!==data.sourceRegionId||!parent.sources.has(data.sourceFaceId)||parent.sources.has(faceId))return false;
   liveGeneric.delete(data.target);liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set(parent.sources),origins:new Set(parent.origins)});features.set(id,{kind:'generic-blind-hole'});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_THROUGH_HOLES_V1'){
   let data;try{data=captureAuthoredHoleIntent(p);}catch{return false;}const spec=build(data),parent=liveGeneric.get(data.target),source=features.get(fid(data.sourceFeatureId));
   if(!spec||spec.throughHoleVersion!==1||fid(data.featureId)!==id||!parent||parent.build!==spec||!source||source.kind!=='selected-profile'||source.sourceFace!==data.sourceFaceId||source.regionId!==data.sourceRegionId||!parent.sources.has(data.sourceFaceId)||parent.sources.has(faceId))return false;
   liveGeneric.delete(data.target);liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set(parent.sources),origins:new Set(parent.origins),holeSource:parent.holeSource===data.sourceFeatureId?parent.holeSource:null,seeds:parent.holeSource===data.sourceFeatureId?new Set([...parent.seeds,...(data.kind==='centered-through'?[data.featureId]:[])]):new Set()});features.set(id,{kind:'generic-through-hole'});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_SOLID_EDGE_TREATMENT_V1'){
   let data;try{data=captureSolidEdgeTreatment(p);}catch{return false;}const spec=build(data),parent=liveGeneric.get(data.target);
   if(!spec||spec.edgeTreatmentVersion!==1||fid(data.featureId)!==id||!parent||parent.build!==spec||parent.sources.has(faceId))return false;
   liveGeneric.delete(data.target);liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set(parent.sources),origins:new Set(parent.origins),holeSource:parent.holeSource,seeds:parent.seeds});features.set(id,{kind:'generic-edge-treatment'});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_LINEAR_HOLE_PATTERN_V1'){
   let data;try{data=captureOwnedLinearHolePatternIntent(p);linearHolePatternNativeCost(data.count);}catch{return false;}const spec=build(data),parent=liveGeneric.get(data.target);
   if(!spec||spec.linearHolePatternVersion!==1||fid(data.featureId)!==id||!parent||parent.build!==spec||!parent.holeSource||!parent.seeds?.has(data.seedFeatureId)||parent.sources.has(faceId))return false;
   // Only the explicit constructor→hole→cuts/edge path carries seed references.
   // Generic Booleans and pattern outputs deliberately carry no such witness.
   liveGeneric.delete(data.target);liveGeneric.set(solidBodyId(data.featureId),{producer:id,build:spec,sources:new Set(parent.sources),origins:new Set(parent.origins)});features.set(id,{kind:'generic-linear-hole-pattern'});genericBuild=spec;continue;
  }
  if(item.type==='WORKER_RECTANGLE_EXTRUDE_V1'){if(!plain(p,['featureId','face','regions','length'])||!field(p.face)||!Array.isArray(p.regions)||p.regions.length!==1||Reflect.ownKeys(p.regions).length!==2||!Object.hasOwn(p.regions,0)||!field(p.regions[0])||!numberField(p.length)||p.face===faceId)return false;features.set(id,{kind:'prism',sourceFace:p.face,regionId:p.regions[0]});continue;}
  if(item.type==='WORKER_CENTERED_THROUGH_HOLE_V1'){if(!plain(p,['featureId','face','diameter'])||!numberField(p.diameter))return false;const t=semantic(p.face),parent=t&&features.get(t[0]);if(!t||t.length!==4||typeof t[0]!=='string'||t[1]!=='face'||t[2]!=='LID'||!parent||parent.kind!=='prism'||!plain(t[3],['regionId'])||t[3].regionId!==parent.regionId||parent.sourceFace===faceId)return false;features.set(id,{kind:'hole',sourceFace:parent.sourceFace,parent:t[0],regionId:parent.regionId});continue;}
  if(item.type==='WORKER_FOUR_CORNER_THROUGH_HOLES_V1'){if(!plain(p,['featureId','face','sideIds','diameter','offsetX','offsetY'])||!numberField(p.diameter)||!numberField(p.offsetX)||!numberField(p.offsetY)||!plain(p.sideIds,['minX','maxX','minY','maxY'])||['minX','maxX','minY','maxY'].some(k=>!field(p.sideIds[k]))||new Set(Object.values(p.sideIds)).size!==4)return false;const t=semantic(p.face),parent=t&&features.get(t[0]);if(!t||t.length!==4||typeof t[0]!=='string'||t[1]!=='face'||t[2]!=='HOLE_WALL'||!parent||parent.kind!=='hole'||!plain(t[3],['parentFeatureId','regionId'])||t[3].parentFeatureId!==parent.parent||t[3].regionId!==parent.regionId||parent.sourceFace===faceId)return false;features.set(id,{kind:'corner',sourceFace:parent.sourceFace});continue;}

  return false;
 }
 return true;
}
// Precompute the exact namespace signature for one known private write. It is
// not derived from installed/observer-owned bytes after publication.
export function knownOwnSketchSaveTip(tip,key,version){
 if(typeof tip!=='string'||tip.length>262144||typeof key!=='string'||!key||key.length>1024||!Number.isSafeInteger(version)||version<1)throw Error('Invalid owned sketch write.');
 const rows=JSON.parse(tip),seen=new Set();if(!Array.isArray(rows)||rows.length>256)throw Error('Invalid sketch baseline.');
 for(const row of rows){if(!Array.isArray(row)||row.length!==2||typeof row[0]!=='string'||!row[0]||seen.has(row[0])||!Number.isSafeInteger(row[1])||row[1]<1)throw Error('Invalid sketch baseline.');seen.add(row[0]);}
 const next=rows.filter(row=>row[0]!==key);next.push([key,version]);if(next.length>256)throw Error('Sketch workspace exceeds the edit limit.');if(next.reduce((n,row)=>n+row[0].length,0)>131072||next.some(row=>row[0].length>1024))throw Error('Sketch workspace exceeds key limits.');next.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);return JSON.stringify(next);
}
// Both participants are prepared and checked before the first synchronous install.
export function commitUnconsumedSketchSave({data,current,preparePublication,prepareWrites,afterCommit,valid,superseded}){
 if(typeof data!=='string'||!current())throw Error('The authored sketch changed; reopen before saving.');
 const publication=preparePublication();let workspace=null,committed=false;
 try{workspace=prepareWrites(data);if(!current()||!publication.isCurrent()||!workspace.isCurrent())throw superseded(false);workspace.commit();publication.commit();committed=true;
  // Once both values are installed, deliver both guarded invalidations even if
  // rearming fails. Preserve the first failure, including committed markers.
  let failed=false,firstError;const attempt=fn=>{try{fn()}catch(error){if(!failed){failed=true;firstError=error}}};
  attempt(afterCommit);attempt(()=>publication.notify(valid));attempt(()=>workspace.notify(valid));attempt(()=>{if(!valid())throw superseded(true)});if(failed)throw firstError;
 }
 finally{if(!committed)workspace?.discard();}
}
export function isStableSketchForSave(viewer){const manager=viewer?.parametricManager,tools=viewer?.toolManager;if(!manager||manager.inTransaction||!Array.isArray(manager.stages)||manager.stages.length>128||viewer?.historyManager?.recoverySnapshot||tools&&tools.tool!==tools.defaultTool)return false;for(const stage of manager.stages){const system=stage?.algNumSystem;if(!system||system.inTransaction||system.transactionBefore||!(system.conflicting instanceof Set)||!(system.redundant instanceof Set))return false;for(const relation of system.conflicting)if(!system.redundant.has(relation))return false;}return true}
export function sameSketchSaveFrame(a,b){
 try{const keys=['origin','x','y','z'],read=frame=>{if(!frame||typeof frame!=='object'||Array.isArray(frame)||Reflect.ownKeys(frame).length!==4||Reflect.ownKeys(frame).some(k=>typeof k!=='string'||!keys.includes(k)))return null;const out=[];for(const key of keys){const d=Object.getOwnPropertyDescriptor(frame,key);if(!d?.enumerable||!Object.hasOwn(d,'value')||!Array.isArray(d.value)||d.value.length!==3||Reflect.ownKeys(d.value).length!==4)return null;for(let i=0;i<3;i++){const n=Object.getOwnPropertyDescriptor(d.value,String(i));if(!n?.enumerable||!Object.hasOwn(n,'value')||typeof n.value!=='number'||!Number.isFinite(n.value))return null;out.push(n.value)}}return out};const x=read(a),y=read(b);return !!x&&!!y&&x.every((n,i)=>Math.abs(n-y[i])<=1e-9)}catch{return false}
}
// The caller receives the original failure; reporting it also covers UI event dispatch.
export async function saveAndExitEditor(editor,report){const face=editor.face,viewer=editor.viewer;try{const receipt=await editor.save();if(!receipt||typeof receipt.verifyBeforeExit!=='function')throw Error('Sketch save did not produce an exit receipt.');receipt.verifyBeforeExit();if(editor.face!==face||editor.viewer!==viewer)throw new DOMException('Sketch editor was superseded.','AbortError');editor.exit()}catch(error){try{report(error?.message||'The sketch could not be saved.')}catch(_){}throw error}}

// An exit receipt never exposes sketch data. A failed post-commit check must
// not imply that the already-installed workspace bytes were rolled back.
export function makeSketchSaveReceipt(verify,committed){if(typeof verify!=='function'||typeof committed!=='boolean')throw Error('Invalid sketch save receipt.');return Object.freeze({verifyBeforeExit(){let valid=false;try{valid=verify()===true}catch{}if(!valid){const error=new DOMException(committed?'Saved sketch was superseded; new edits remain open.':'Sketch save was superseded.','AbortError');if(committed)Object.defineProperty(error,'committed',{value:true,enumerable:true});throw error}return true}})}
