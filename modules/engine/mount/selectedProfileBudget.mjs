import {captureSourceFrameParameters} from '../source/sourceFrameIntent.mjs';
import {featureSuppressed} from '../solid/authoredHistoryState.mjs';
import {AUTHORED_SOLID_KINDS} from '../solid/authoredSolidKinds.mjs';
// Pure selected-owned evaluation policy. No geometry, callbacks, model writes,
// or heap-used/OS-memory guarantee. Legacy mounts keep their existing policy.
import {linearHolePatternNativeCost} from '../solid/ownedLinearHolePatternIntent.mjs';
import {captureOwnedShellFeature} from '../solid/ownedShellFeature.mjs';
import {requireCadEngineBuild} from './engineCatalog.mjs';
export const SELECTED_PROFILE_BUDGET=Object.freeze({scope:'selected-owned-evaluation-v1',maxLifetimeNames:32,maxCumulativeResultTriangles:100000});
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const genericTypes=AUTHORED_SOLID_KINDS;
const separateMountTypes=['WORKER_RECTANGLE_EXTRUDE_V1','WORKER_CENTERED_THROUGH_HOLE_V1','WORKER_FOUR_CORNER_THROUGH_HOLES_V1','WORKER_ENCLOSURE_V1','WORKER_ENCLOSURE_V2'];
export function selectedProfileHistoryBudget(history,engineRevision){
 if(typeof engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(engineRevision))fail('INVALID_REQUEST','Expected the selected build identity.');
 if(!Array.isArray(history)||history.length>256||Reflect.ownKeys(history).length!==history.length+1)fail('INVALID_REQUEST','Expected bounded dense authored history.');
 let count=0,separateMountFeatures=0;const unsupported=new Set(),incompatible=[];
 for(let i=0;i<history.length;i++){
  const d=Object.getOwnPropertyDescriptor(history,String(i)),entry=d?.value,type=entry&&typeof entry==='object'&&!Array.isArray(entry)?Object.getOwnPropertyDescriptor(entry,'type'):null;
  if(!d?.enumerable||!Object.hasOwn(d,'value')||!type?.enumerable||!Object.hasOwn(type,'value')||typeof type.value!=='string'||!type.value||type.value.length>128)fail('INVALID_REQUEST','History operation types must be bounded data.');
  if(genericTypes.includes(type.value)){
   const p=Object.getOwnPropertyDescriptor(entry,'params'),params=p?.value;
   if(!p?.enumerable||!Object.hasOwn(p,'value')||!params||typeof params!=='object'||Array.isArray(params))fail('INVALID_REQUEST','Generic runtime identity is unavailable.');
   const engine=Object.getOwnPropertyDescriptor(params,'engine'),revision=Object.getOwnPropertyDescriptor(params,'engineRevision');
   if(!engine?.enumerable||!Object.hasOwn(engine,'value')||typeof engine.value!=='string'||!engine.value||engine.value.length>32||!revision?.enumerable||!Object.hasOwn(revision,'value')||typeof revision.value!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(revision.value))fail('INVALID_REQUEST','Generic runtime identity must be bounded data.');
   let cost=1;
   if(type.value==='WORKER_SOLID_SHELL_V1'){
    const shell=captureOwnedShellFeature(params),build=requireCadEngineBuild(shell.engine,shell.engineRevision);
    if(build.shellVersion!==1)fail('UNSUPPORTED_SHELL_BUILD','The authored shell requires its recorded shell-capable runtime.');
    // One genuine native shell result. Detached working copies are temporary,
    // not additional persistent result names or another authored model.
    cost=1;
   }
   if(type.value==='WORKER_CENTERED_BLIND_HOLE_V1'){const build=requireCadEngineBuild(engine.value,revision.value);if(build.blindHoleVersion!==1)fail('UNSUPPORTED_BLIND_HOLE_BUILD','The saved blind hole requires its exact capable build.');cost=2;}
   if(type.value==='WORKER_THROUGH_HOLES_V1'){
    const kind=Object.getOwnPropertyDescriptor(params,'kind');
    if(!kind?.enumerable||!Object.hasOwn(kind,'value')||!['centered-through','four-corner-through'].includes(kind.value))fail('INVALID_REQUEST','Through-hole result cost requires a supported data kind.');
    cost=kind.value==='centered-through'?2:8;
   }
   if(type.value==='WORKER_LINEAR_HOLE_PATTERN_V1'){
    const count=Object.getOwnPropertyDescriptor(params,'count');
    if(!count?.enumerable||!Object.hasOwn(count,'value'))fail('INVALID_REQUEST','Pattern result cost requires an authored count.');
    cost=linearHolePatternNativeCost(count.value);
   }
   if(engine.value==='occ'&&revision.value===engineRevision){if(!featureSuppressed(entry))count+=cost;}
   else incompatible.push(Object.freeze({index:i,type:type.value,engine:engine.value,engineRevision:revision.value}));
  }else if(separateMountTypes.includes(type.value))separateMountFeatures++;
  else if(type.value==='SOURCE_FRAME_V1')captureSourceFrameParameters(entry.params);
  else if(type.value!=='PLANE')unsupported.add(type.value);
 }
 const supported=!unsupported.size,compatible=!incompatible.length,estimated=supported&&compatible,withinLimit=estimated&&count<=SELECTED_PROFILE_BUDGET.maxLifetimeNames;
 return Object.freeze({...SELECTED_PROFILE_BUDGET,supported,compatible,reason:!supported?'UNSUPPORTED_HISTORY':!compatible?'INCOMPATIBLE_ENGINE_BUILD':withinLimit?null:'RESOURCE_LIMIT',plannedNativeResults:estimated?count:null,remainingNativeResults:estimated?Math.max(0,SELECTED_PROFILE_BUDGET.maxLifetimeNames-count):null,withinLimit,canAppend:estimated&&count<SELECTED_PROFILE_BUDGET.maxLifetimeNames,separateMountFeatures,unsupportedTypes:Object.freeze([...unsupported]),incompatibleOperations:Object.freeze(incompatible)});
}
export function createSelectedResultTriangleBudget(){
 const results=new Map();let total=0,closed=false;
 const inspect=()=>Object.freeze({scope:SELECTED_PROFILE_BUDGET.scope,closed,chargedResults:results.size,cumulativeResultTriangles:total,maxCumulativeResultTriangles:SELECTED_PROFILE_BUDGET.maxCumulativeResultTriangles});
 return Object.freeze({inspect,charge(token,triangles){
  if(closed)fail('MOUNT_CLOSED','Selected result budget is closed.');
  if(typeof token!=='string'||!token||token.length>256||!Number.isSafeInteger(triangles)||triangles<0)fail('ENGINE_FAILURE','Invalid selected result budget evidence.');
  if(results.has(token)){if(results.get(token)!==triangles)fail('ENGINE_FAILURE','Selected result tessellation changed.');return inspect();}
  if(results.size>=SELECTED_PROFILE_BUDGET.maxLifetimeNames||triangles>SELECTED_PROFILE_BUDGET.maxCumulativeResultTriangles-total)fail('RESOURCE_LIMIT','Selected candidate cumulative result triangle budget exhausted.');
  results.set(token,triangles);total+=triangles;return inspect();
 },close(){closed=true;results.clear();total=0;}});
}
