import {captureSourceFrameParameters,captureNativeFaceParent,captureSourceFrame,sourceFrameFail as fail} from 'engine/source/sourceFrameIntent.mjs';
import {canonicalAuthoredFeatureId as fid} from './authoredFeatureIdentity.mjs';
import {sourcePlaneFaceId} from './sourcePlaneIdentity.mjs';
import {readCandidateWorkerPlanarFace} from 'engine/solid/solidLedger.mjs';
import {runSourceFramePreparation} from 'sketcher/headless/sourceFrameClient';
import {sketchBoundaryFrame} from '../sketch/boundaryValidity';
import {MOpenFaceShell} from '../model/mopenFace';
import {sameSketchSaveFrame} from './unconsumedSketchSave.mjs';
import {captureSourcePlaneParameters} from 'sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {assertPipelineHistoryCurrent} from './capturePipelineHistory.mjs';
import workerUrl from 'codi-headless-sketch-worker';
const permits=new WeakMap<object,any>();
const principalBases=new WeakMap<object,any>(),principalProofs=new WeakMap<object,any>();
function principalRows(ctx:any,history:any[],registry:any,sources:Map<string,string>){
 if(sources.size>64||history.length>256)fail('RESOURCE_LIMIT','Principal source basis exceeds its bound.');
 let units=0;const rows:any[]=[];
 for(const[id,text]of sources){const face=registry.findFace(id),index=face?.root?.originatingOperation,entry=history[index];
  if(typeof id!=='string'||!id||id.length>256||typeof text!=='string'||text.length>65536||(units+=text.length)>262144||
    !(face?.root instanceof MOpenFaceShell)||!face.isPlaneBased||face.defaultSketchId!==id||!Number.isSafeInteger(index)||
    !entry||!['PLANE','SOURCE_FRAME_V1'].includes(entry.type))fail('UNRESOLVED_SOURCE','The complete source proof lost its actual independent face.');
  const parameters=entry.type==='PLANE'?captureSourcePlaneParameters(entry.params):captureSourceFrameParameters(entry.params);
  if(sourcePlaneFaceId(fid(parameters.featureId))!==id)fail('UNRESOLVED_SOURCE','The complete source producer identity changed.');
  rows.push(Object.freeze({id,data:text,index,featureId:fid(parameters.featureId),type:entry.type,parameters,frame:captureSourceFrame(sketchBoundaryFrame(face))}));
 }
 return Object.freeze(rows);
}
function currentPrincipalSources(ctx:any){const rows=ctx.sketchStorageService.getAllSketches();if(!Array.isArray(rows)||rows.length>64)fail('RESOURCE_LIMIT','Principal sources exceed64.');const sources=new Map<string,string>();for(const row of rows){if(sources.has(row.id))fail('UNRESOLVED_SOURCE','Duplicate source identity.');sources.set(row.id,ctx.sketchStorageService.getSketchData(row.id));}return sources;}
export function acceptedPrincipalSourceRows(ctx:any,requireCurrent:()=>void){requireCurrent();const state=ctx.craftService.modifications$.value;if(state.pointer!==state.history.length-1)fail('INVALID_WORKSPACE','Accepted source rows require the actual complete tip.');const rows=principalRows(ctx,state.history,ctx.cadRegistry,currentPrincipalSources(ctx));requireCurrent();return rows;}
export function capturePrincipalSourceBasis(ctx:any,{history,registry,owner,requireCurrent}:any){
 requireCurrent();owner.requireObservationOnly();owner.requireCurrent();if(owner.state!=='candidate')fail('INVALID_WORKSPACE','A genuine private complete replay is required.');
 const sources=currentPrincipalSources(ctx),rows=principalRows(ctx,history,registry,sources),token=Object.freeze({});
 principalBases.set(token,{ctx,project:ctx.projectService,storage:ctx.storageService,sketches:ctx.sketchStorageService,accepted:ctx.craftService.modifications$.value,sources,rows,requireCurrent});return token;
}
export function readPrincipalSourceBasis(token:any,ctx:any){const p=principalBases.get(token);if(!p||p.ctx!==ctx||p.project!==ctx.projectService||p.storage!==ctx.storageService||p.sketches!==ctx.sketchStorageService||p.accepted!==ctx.craftService.modifications$.value)fail('INVALID_WORKSPACE','The private complete source basis is unavailable.');p.requireCurrent();return p.rows;}
export function releasePrincipalSourceBasis(token:any){principalBases.delete(token);}
export function capturePrincipalSourceProof(ctx:any,{history,registry,owner,permit,requireCurrent}:any){
 requireCurrent();owner.requireObservationOnly();owner.requireCurrent();if(owner.state!=='candidate')fail('INVALID_WORKSPACE','A genuine private complete source proof is required.');
 const changes=preparedNativeSourceChanges(permit),sources=currentPrincipalSources(ctx);for(const row of changes){if(row.after===null)sources.delete(row.faceId);else sources.set(row.faceId,row.after);}
 const rows=principalRows(ctx,history,registry,sources),token=Object.freeze({});principalProofs.set(token,{ctx,project:ctx.projectService,storage:ctx.storageService,history,rows,changes,models:Object.freeze([...registry.models]),requireCurrent});return token;
}
export function readPrincipalSourceProof(token:any,ctx:any){const p=principalProofs.get(token);if(!p||p.ctx!==ctx||p.project!==ctx.projectService||p.storage!==ctx.storageService)fail('INVALID_WORKSPACE','The private complete source proof is unavailable.');p.requireCurrent();return p;}
export function releasePrincipalSourceProof(token:any){principalProofs.delete(token);}
const same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
export function hasNativeSourceAttachments(history:any[]){return history.some(row=>row.type==='SOURCE_FRAME_V1'&&captureSourceFrameParameters(row.params).parent?.kind==='native-planar-face');}
export function nativeSourceDescendants(history:any[]){const selected=new Set<number>();for(const row of history)if(row.type==='SOURCE_FRAME_V1'){const p=captureSourceFrameParameters(row.params);if(p.parent?.kind==='native-planar-face'||p.parent&&selected.has(p.parent.featureId))selected.add(fid(p.featureId));}return selected;}
export function sourceAttachmentDepths(history:any[]){const depths=new Map<number,number>(),sources=new Map<string,any>();for(let i=0;i<history.length;i++){const entry=history[i];if(!['PLANE','SOURCE_FRAME_V1'].includes(entry.type))continue;const id=fid(entry.params.featureId);let depth=0;if(entry.type==='SOURCE_FRAME_V1'){const p=captureSourceFrameParameters(entry.params);if(p.parent){let source;if(p.parent.kind==='native-planar-face'){const origin=history.findIndex(row=>fid(row.params.featureId)===p.parent.sourceFeatureId),target=history.findIndex(row=>fid(row.params.featureId)===p.parent.featureId);source=sources.get(p.parent.sourceFaceId);if(origin<0||target<origin||target>=i||!source||source.index>=origin||history[origin].type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2'||history[origin].params.faceId!==p.parent.sourceFaceId)fail('INVALID_FRAME_DEPENDENCY','Native source ancestry is not an earlier acyclic constructor chain.');}else{source=sources.get(p.parent.faceId);if(!source||source.featureId!==p.parent.featureId)fail('INVALID_FRAME_DEPENDENCY','Source ancestry changed.');}depth=(depths.get(source.featureId)||0)+1;}if(depth>16)fail('RESOURCE_LIMIT','Source attachment ancestry exceeds16.');}depths.set(id,depth);sources.set(sourcePlaneFaceId(id),{featureId:id,index:i});}return depths;}
// Issued only on the normal shared edit path, never from a public flag.
export function issueNativeSourceReplay(ctx:any,{history,kind,direction,expectedSketches,createdSourceId,removedSourceIds=[],repair=false,sourceBasis,requireCurrent}:any){
 if(!['source-frame','selected-profile-depth','selected-profile-region'].includes(kind)||typeof requireCurrent!=='function')fail('INVALID_WORKSPACE','Unsupported native source publication.');
 sourceAttachmentDepths(history);
 requireCurrent();const project=ctx.projectService,storage=ctx.storageService,sketches=ctx.sketchStorageService,sources=new Map<string,string>(),frames=new Map();
 if(sourceBasis){const rows=readPrincipalSourceBasis(sourceBasis,ctx);for(const row of rows){if(sketches.getSketchData(row.id)!==row.data)fail('STALE_SOURCE','The complete source basis changed.');sources.set(row.id,row.data);frames.set(row.id,row.frame);}principalBases.delete(sourceBasis);}
 else{const rows=sketches.getAllSketches();let units=0;if(!Array.isArray(rows)||rows.length>64||history.length>256)fail('RESOURCE_LIMIT','Native source inventory exceeds its bound.');
  for(const row of rows){requireCurrent();const id=row.id,text=sketches.getSketchData(id),face=ctx.cadRegistry.findFace(id);if(typeof id!=='string'||!id||id.length>256||sources.has(id)||typeof text!=='string'||text.length>65536||(units+=text.length)>262144||!(face?.root instanceof MOpenFaceShell)||face.defaultSketchId!==id)fail('UNRESOLVED_SOURCE','Native attachment requires every actual bounded independent source.');sources.set(id,text);frames.set(id,sketchBoundaryFrame(face));}}
 const token=Object.freeze({});permits.set(token,{ctx,project,storage,sketches,sources,frames,history,kind,direction,expectedSketches,createdSourceId,removed:new Set(removedSourceIds),repair,requireCurrent,result:null});return token;
}
export function isNativeSourceReplay(token:any){return !!token&&permits.has(token);}
export function nativeSourceReplayRepair(token:any){return permits.get(token)?.kind==='source-frame'&&permits.get(token)?.repair===true;}
export function nativeSourceReplayDirection(token:any){return permits.get(token)?.direction;}
export function preparedNativeSourceChanges(token:any){const p=permits.get(token);if(!p?.result)fail('INVALID_WORKSPACE','Native source preparation is incomplete.');p.requireCurrent();return p.result;}

// ONE actual evaluatePipeline. The installer never reaches a public service,
// operation argument, registry or live storage object.
export async function createNativeSourceReplay({ctx,history,owner,source,readSketch,permit,requireCurrent,expectedRun,overrideIds=[]}:any){
 const affected=nativeSourceDescendants(history),authorization=permit&&permits.get(permit);
 if(!affected.size&&!authorization)return null;
 sourceAttachmentDepths(history);
 if(permit&&!authorization)fail('INVALID_WORKSPACE','Native source publication capability is unavailable.');
 const inventory=source.getAllSketches();if(!Array.isArray(inventory)||inventory.length>64)fail('RESOURCE_LIMIT','Native source inventory exceeds64.');
 const initial=new Map<string,string>(),installed=new Map<string,string>(),visited=new Set<number>(),preparedFrames=new Map<string,any>();let units=0,currentEntry:any=null,registry:any=null,finished=false;
 const ids=[...inventory.map(row=>row.id),...overrideIds.filter((id:string)=>!inventory.some(row=>row.id===id))];if(ids.length>64)fail('RESOURCE_LIMIT','Native source snapshot exceeds64 sources.');
 for(const id of ids){const text=source.getSketchData(id);if(typeof text!=='string'||text.length>65536||initial.has(id)||(units+=text.length)>262144)fail('RESOURCE_LIMIT','Native source snapshot exceeds its bound.');initial.set(id,text);}
 if(authorization){authorization.requireCurrent();if(authorization.owner||authorization.ctx!==ctx||authorization.project!==ctx.projectService||authorization.storage!==ctx.storageService||authorization.sketches!==ctx.sketchStorageService)fail('INVALID_WORKSPACE','Native source owner changed or its one-use preparation was reused.');authorization.owner=owner;await assertPipelineHistoryCurrent(history,authorization.history,()=>{requireCurrent();authorization.requireCurrent();});authorization.requireCurrent();}
 const sourceDescriptor=ctx.operationService.get('SOURCE_FRAME_V1'),sourceAdmission=sourceDescriptor.admitGeometry;
 const current=()=>{requireCurrent();owner.requireCurrent();authorization?.requireCurrent();if(owner.state!=='candidate'||finished||ctx.operationService.get('SOURCE_FRAME_V1')!==sourceDescriptor||sourceDescriptor.run!==expectedRun||sourceDescriptor.admitGeometry!==sourceAdmission)throw new DOMException('Native source replay was superseded.','AbortError');};
 const view=Object.freeze({getAllSketches(){const rows=[...initial.keys()].filter(id=>!authorization?.removed.has(id)).map(id=>({id}));for(const id of installed.keys())if(!rows.some(row=>row.id===id))rows.push({id});return rows;},getSketchData(id:string){return authorization?.removed.has(id)?null:installed.has(id)?installed.get(id)!:initial.get(id)??null;},hasSketch(id:string){return this.getSketchData(id)!==null;},readSketch(id:string){const text=this.getSketchData(id);return text===null?null:readSketch(JSON.parse(text),id,true);},setSketchData(){throw Error('Native source replay is read-only.');},removeSketchData(){throw Error('Native source replay is read-only.');}});
 async function prepare(raw:any,run:any){
  current();const slot=currentEntry,featureId=fid(raw.featureId);if(!slot||slot.entry.params!==raw||slot.entry.type!=='SOURCE_FRAME_V1'||slot.operation.run!==run||run!==expectedRun||ctx.operationService.get('SOURCE_FRAME_V1').run!==expectedRun||history[slot.index]!==slot.entry||!registry)fail('INVALID_WORKSPACE','Only the current genuine captured source producer can prepare attachment.');
  if(!affected.has(featureId))return null;
  if(visited.has(featureId))fail('INVALID_WORKSPACE','An attached source can be prepared only once per evaluation.');visited.add(featureId);
  const p=captureSourceFrameParameters(raw),parameterText=JSON.stringify(p),id=sourcePlaneFaceId(featureId);let parentFrame:any;
  const slotCurrent=()=>{current();if(currentEntry!==slot||JSON.stringify(captureSourceFrameParameters(raw))!==parameterText)throw new DOMException('Native source intent changed.','AbortError');};
  if(p.parent?.kind==='native-planar-face'){
   const parent=captureNativeFaceParent(p.parent),at=history.findIndex(row=>fid(row.params.featureId)===parent.featureId);if(at<0||at>=slot.index)fail('INVALID_FRAME_DEPENDENCY','The native parent must be earlier than its attached source.');
   parentFrame=(await readCandidateWorkerPlanarFace({owner,registry,parent,valid:()=>{try{slotCurrent();return true;}catch{return false;}}})).frame;slotCurrent();
  }else{const face=p.parent&&registry.findFace(p.parent.faceId),at=face?.root?.originatingOperation;if(!(face?.root instanceof MOpenFaceShell)||!Number.isSafeInteger(at)||at>=slot.index||fid(history[at].params.featureId)!==p.parent.featureId)fail('INVALID_FRAME_DEPENDENCY','An attached source descendant lost its earlier source parent.');parentFrame=sketchBoundaryFrame(face);}
  const runFrame=(r:any)=>runSourceFramePreparation(workerUrl,{revision:crypto.randomUUID(),...r},{signal:owner.signal,valid:()=>{try{slotCurrent();return true;}catch{return false;}}});
  const frame=(await runFrame({mode:'derive',parameters:p,parentFrame})).frame;slotCurrent();
  const before=authorization?authorization.sources.get(id)??null:initial.get(id)??null;
  let reply:any;if(before===null){if(!authorization||authorization.createdSourceId!==id)fail('UNRESOLVED_SOURCE','The independent attached source is missing.');reply=await runFrame({mode:'empty',sketchJSON:null,beforeFrame:null,afterFrame:frame,candidateJSON:null});}
  else{const oldFrame=authorization?authorization.frames.get(id):captureSourceFrame(frame);if(!oldFrame)fail('UNRESOLVED_SOURCE','The accepted source frame is unavailable.');const desired=authorization?.expectedSketches?.find((row:any)=>row.faceId===id)?.after??null;reply=await runFrame({mode:'reframe',sketchJSON:before,beforeFrame:oldFrame,afterFrame:frame,candidateJSON:authorization?desired:before});}
  slotCurrent();if(!authorization&&reply.serializedSketch!==before)fail('STALE_FRAME','Read/Open cannot rewrite an attached source cache.');
  const proposed=source.getSketchData(id);if(proposed!==null&&proposed!==before&&proposed!==reply.serializedSketch)fail('INTENT_CHANGED','Static and native source proposals disagree.');
  installed.set(id,reply.serializedSketch);preparedFrames.set(id,{frame:reply.frame,index:slot.index});return Object.freeze({frame:reply.frame});
 }
 return Object.freeze({view,bindRegistry(value:any){if(registry)fail('INVALID_WORKSPACE','Native source registry can be bound only once.');registry=value;},enter(index:number,operation:any){current();if(currentEntry)fail('INVALID_WORKSPACE','Reentrant native source producer.');currentEntry={index,entry:history[index],operation};},leave(){currentEntry=null;},prepare,
  finish(endIndex:number){current();for(let i=0;i<=endIndex;i++)if(history[i].type==='SOURCE_FRAME_V1'&&affected.has(fid(history[i].params.featureId))&&!visited.has(fid(history[i].params.featureId)))fail('UNRESOLVED_SOURCE','An attached source was not prepared by its real producer.');
   for(const[id,row]of preparedFrames){const face=registry.findFace(id);if(!(face?.root instanceof MOpenFaceShell)||face.defaultSketchId!==id||face.root.originatingOperation!==row.index||!sameSketchSaveFrame(sketchBoundaryFrame(face),row.frame)||view.getSketchData(id)!==installed.get(id))fail('UNRESOLVED_SOURCE','The actual independent source differs from its native-bound preparation.');}
   if(authorization){let charge=0;const changes:any[]=[],ids=new Set([...authorization.sources.keys(),...initial.keys(),...installed.keys()]);for(const id of ids){const before=authorization.sources.get(id)??null,after=view.getSketchData(id);if(before!==after){if((charge+=(before?.length||0)+(after?.length||0))>32768)fail('RESOURCE_LIMIT','Native source journal delta exceeds64KiB retained UTF16.');changes.push(Object.freeze({faceId:id,before,after}));}}
    if(authorization.expectedSketches!==undefined&&(changes.length!==authorization.expectedSketches.length||changes.some(row=>!authorization.expectedSketches.some((v:any)=>same(v,row)))))fail('INTENT_CHANGED','Native source travel differs from its actual recorded bytes.');authorization.result=Object.freeze(changes);
   }finished=true;return authorization?.result||Object.freeze([]);
  }});
}
