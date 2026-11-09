import {PROFILE_EXTENT_TYPE,captureOwnedProfileExtentFeature} from 'engine/solid/ownedProfileExtentFeature.mjs';
import {inspectWorkerMechanicalSource} from 'engine/solid/solidLedger.mjs';
import {MOpenFaceShell} from '../model/mopenFace';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {getSketchBoundaries} from '../sketch/sketchBoundaries';

const fail=(code:string,message:string):never=>{throw Object.assign(Error(message),{code});};
// This private observation supplies discovery eligibility only. Actual bore
// creation still resolves the real source and independently validates Native
// geometry in its candidate. No descriptor is persisted or accepted as a flag.
export function captureExtentMechanicalSource(ctx:any,history:any[],origin:any,build:any,model:any){
 if(origin.kind!=='sketch-profile-extent'||build.profileExtentsVersion!==1)fail('UNRESOLVED_SOURCE','The installed extent source capability is unavailable.');
 if(!Array.isArray(history)||history.length>256||Reflect.ownKeys(history).length!==history.length+1)fail('INVALID_SOURCE','Expected bounded dense authored source history.');
 const matches:any[]=[];
 for(let i=0;i<history.length;i++){
  const d=Object.getOwnPropertyDescriptor(history,String(i)),entry=d?.value,t=entry&&Object.getOwnPropertyDescriptor(entry,'type');
  if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!t?.enumerable||!Object.prototype.hasOwnProperty.call(t,'value'))fail('INVALID_SOURCE','Source history must be dense data.');
  if(t.value!==PROFILE_EXTENT_TYPE)continue;
  const p=Object.getOwnPropertyDescriptor(entry,'params');if(!p?.enumerable||!Object.prototype.hasOwnProperty.call(p,'value'))fail('INVALID_SOURCE','Extent source parameters must be own data.');
  const captured=captureOwnedProfileExtentFeature(p.value);if(captured.featureId===origin.featureId)matches.push({entry,params:p.value,captured});
 }
 if(matches.length!==1)fail('UNRESOLVED_SOURCE','Exactly one actual authored extent source is required.');
 const r=matches[0],p=r.captured;
 if(p.regionId!==origin.regionId||p.engineRevision!==build.revision)fail('UNRESOLVED_SOURCE','The actual extent source differs from the selected origin.');
 const craft=ctx.craftService,registry=ctx.cadRegistry,project=ctx.projectService,sketches=ctx.sketchStorageService,expressions=ctx.expressionService,manager=ctx.projectManager,state=craft.modifications$.value,generation=project.documentGeneration,signal=project.documentSignal;
 if(state.history!==history)fail('STALE_SOURCE','The inspected source history changed.');
 const face=registry.findFace(p.faceId);
 if(!(face?.root instanceof MOpenFaceShell)||!face.isPlaneBased||face.id!==p.faceId||face.defaultSketchId!==p.faceId||!craft.models$.value.includes(face.root))fail('UNSUPPORTED_FACE','The original retained extent source plane is required.');
 const source=sketches.getSketchData(p.faceId),script=expressions.script$.value,frameText=JSON.stringify(sketchBoundaryFrame(face)),boundary=getSketchBoundaries(face);
 if(typeof source!=='string'||source.length>65536||typeof script!=='string'||script.length>65536)fail('UNSUPPORTED_SOURCE','The bounded original native source and definitions are required.');
 if(['lines','arcs','circles','nurbses'].some(k=>!Array.isArray(boundary[k])||boundary[k].length))fail('UNSUPPORTED_FACE','Referenced boundary geometry is unsupported.');
 const streams=[expressions.script$,expressions.table$,expressions.list$,expressions.errors$],versions=streams.map(s=>s.revision),aborted=Function.call.bind(Object.getOwnPropertyDescriptor(AbortSignal.prototype,'aborted').get);
 const valid=()=>{try{return ctx.craftService===craft&&ctx.cadRegistry===registry&&ctx.projectService===project&&ctx.sketchStorageService===sketches&&ctx.expressionService===expressions&&ctx.projectManager===manager&&manager.unit==='millimeter'&&project.hasHostLifetime&&project.documentGeneration===generation&&project.documentSignal===signal&&(!signal||!aborted(signal))&&project.isDocumentCurrent(generation)&&craft.modifications$.value===state&&state.history===history&&expressions.script$.value===script&&streams.every((s,i)=>s===[expressions.script$,expressions.table$,expressions.list$,expressions.errors$][i]&&s.revision===versions[i]);}catch{return false;}};
 const observe=()=>inspectWorkerMechanicalSource(model,p.featureId,{registry,history,readSketch:(faceId:string)=>sketches.getSketchData(faceId),readFrame:sketchBoundaryFrame,readParameterSource:()=>expressions.script$.value,valid});
 const observed=observe();
 if(observed.status!=='available')fail(observed.reason,'The current published extent/source descriptor is unavailable.');
 if(observed.engine!=='occ'||observed.engineRevision!==build.revision||observed.sourceFaceId!==p.faceId||observed.sourceRegionId!==p.regionId)fail('STALE_SOURCE','The extent observation differs from its actual source/build binding.');
 if(observed.source.kind!=='axis-rectangle')fail('UNSUPPORTED_PROFILE','The actual extent source is not an eligible hole rectangle: '+observed.source.reason+'.');
 return {...r,extent:true,face,root:face.root,source,frameText,parameterText:JSON.stringify(p),observation:observed,observe};
}

export function extentMechanicalSourceCurrent(ctx:any,r:any){
 try{
  if(ctx.cadRegistry.findFace(r.captured.faceId)!==r.face||!ctx.craftService.models$.value.includes(r.root)||r.face.root!==r.root||!(r.root instanceof MOpenFaceShell)||!r.face.isPlaneBased||r.face.defaultSketchId!==r.captured.faceId||ctx.sketchStorageService.getSketchData(r.captured.faceId)!==r.source||JSON.stringify(sketchBoundaryFrame(r.face))!==r.frameText)return false;
  const t=Object.getOwnPropertyDescriptor(r.entry,'type'),p=Object.getOwnPropertyDescriptor(r.entry,'params');
  if(!t?.enumerable||!Object.prototype.hasOwnProperty.call(t,'value')||t.value!==PROFILE_EXTENT_TYPE||!p?.enumerable||!Object.prototype.hasOwnProperty.call(p,'value')||p.value!==r.params||JSON.stringify(captureOwnedProfileExtentFeature(p.value))!==r.parameterText)return false;
  const observed=r.observe();return observed.status==='available'&&observed.source===r.observation.source&&observed.sourceSha256===r.observation.sourceSha256&&observed.requestSha256===r.observation.requestSha256;
 }catch{return false;}
}
