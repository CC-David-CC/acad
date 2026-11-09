import {PROFILE_EXTENT_TYPE,profileExtentFields} from '../../../../modules/engine/solid/ownedProfileExtentFeature.mjs';
import {HISTORY_CONTROL_TYPES, SUPPRESSIBLE_FEATURE_TYPES,featureSuppressed} from '../../../../modules/engine/solid/authoredHistoryState.mjs';
import {canonicalAuthoredFeatureId} from './authoredFeatureIdentity.mjs';
import {captureSourcePlaneParameters} from '../../sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {captureOperationAppend} from './authoredEditJournal.mjs';
export const historyControlFailure=(code,message,details={})=>Object.assign(Error(message),{code,...details});
const fail=(code,message,details)=>{throw historyControlFailure(code,message,details);};
export function validateControlledHistory(history,sourceParents=null){
 if(!Array.isArray(history)||history.length>256||Reflect.ownKeys(history).length!==history.length+1)fail('UNSUPPORTED_HISTORY','History controls require at most 256 dense authored entries.');
 const rows=[],indices=new Map();let sourceCharge=0;
 for(let index=0;index<history.length;index++){
  const own=Object.getOwnPropertyDescriptor(history,String(index)),entry=own?.value;
  if(!own?.enumerable||!Object.hasOwn(own,'value')||!entry||typeof entry!=='object'||Array.isArray(entry))fail('INVALID_HISTORY_STATE','Expected dense authored feature data.');
  const type=Object.getOwnPropertyDescriptor(entry,'type'),params=Object.getOwnPropertyDescriptor(entry,'params');
  if(!type?.enumerable||!Object.hasOwn(type,'value')||!params?.enumerable||!Object.hasOwn(params,'value')||!HISTORY_CONTROL_TYPES.includes(type.value))fail('UNSUPPORTED_HISTORY','This history-control slice supports independent planes, boxes, selected extrusion, holes and edge treatments.');
  const suppressed=featureSuppressed(entry),keys=Reflect.ownKeys(entry);
  if(keys.length!==(suppressed?3:2)||keys.some(k=>!['type','params','suppressed'].includes(k)))fail('INVALID_HISTORY_STATE','Unsupported feature state fields.');
  // Flat schemas in this finite vocabulary permit cheap admission before any
  // exact intent capture. Large native files stay valid, but refuse this edit
  // capability before copying/encoding an unbounded selection inventory.
  const parameterKeys=Reflect.ownKeys(params.value||{});if(parameterKeys.length>32)fail('RESOURCE_LIMIT','History-control parameter headers exceed their bound.');
  const charge=value=>{sourceCharge+=typeof value==='string'?2*value.length:32;if(sourceCharge>262144)fail('RESOURCE_LIMIT','History-control source metadata exceeds256KiB.');};
  for(const key of parameterKeys){const d=Object.getOwnPropertyDescriptor(params.value,key);if(typeof key!=='string'||!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_HISTORY_STATE','History parameters must be own data.');charge(key);const value=d.value;if(Array.isArray(value)){if(value.length>16||Reflect.ownKeys(value).length!==value.length+1)fail('RESOURCE_LIMIT','Selection headers exceed the history-control bound.');for(let i=0;i<value.length;i++){const item=Object.getOwnPropertyDescriptor(value,String(i));if(!item?.enumerable||!Object.hasOwn(item,'value'))fail('INVALID_HISTORY_STATE','Selection lists must be dense own data.');charge(item.value);}}else charge(value);}
  // Canonical identity is validated as a number for this older plane helper;
  // the actual saved params/ID spelling below are never rewritten.
  const p=type.value==='PLANE'?captureSourcePlaneParameters({...params.value,featureId:canonicalAuthoredFeatureId(Object.getOwnPropertyDescriptor(params.value,'featureId')?.value)}):captureOperationAppend(entry).params;
  const featureId=canonicalAuthoredFeatureId(p.featureId);if(indices.has(featureId))fail('DUPLICATE_FEATURE_ID','Duplicate authored producer.');indices.set(featureId,index);
  // This capability is numeric, even if a broader operation supports bindings.
  if(type.value===PROFILE_EXTENT_TYPE&&profileExtentFields(p).some(key=>typeof p[key]!=='number')||type.value==='WORKER_SELECTED_PROFILE_EXTRUDE_V2'&&typeof p.depth!=='number'||type.value==='WORKER_THROUGH_HOLES_V1'&&['diameter',...(p.kind==='four-corner-through'?['offsetX','offsetY']:[])].some(k=>typeof p[k]!=='number'))fail('UNSUPPORTED_PARAMETERS','History controls require literal local dimensions.');
  rows.push({index,featureId,type:type.value,params:p,suppressed,dependencies:[],sourceFeatureIds:[]});
 }
 const parent=(row,id)=>{const index=indices.get(id);if(index===undefined||index>=row.index)fail('INVALID_FEATURE_DEPENDENCY','An authored parent must exist before its child.',{featureId:row.featureId,parentFeatureId:id});if(!row.dependencies.includes(id))row.dependencies.push(id);return rows[index];};
 for(const row of rows){const p=row.params;
  if(['WORKER_SELECTED_PROFILE_EXTRUDE_V2',PROFILE_EXTENT_TYPE].includes(row.type))row.sourceFeatureIds=[row.featureId];
  if(['WORKER_SELECTED_PROFILE_EXTRUDE_V2',PROFILE_EXTENT_TYPE].includes(row.type)&&sourceParents){const id=sourceParents.get(p.faceId);if(id===undefined||parent(row,id).type!=='PLANE')fail('UNRESOLVED_SOURCE','The selected profile needs its actual source-plane producer.');}
  if(row.type==='WORKER_THROUGH_HOLES_V1'){
   const producer=parent(row,p.producerFeatureId),source=parent(row,p.sourceFeatureId);
   if(!producer.sourceFeatureIds.includes(p.sourceFeatureId))fail('INVALID_FEATURE_DEPENDENCY','The target producer does not inherit this source profile.');
   row.sourceFeatureIds=producer.sourceFeatureIds.slice();
   if(!['WORKER_SELECTED_PROFILE_EXTRUDE_V2',PROFILE_EXTENT_TYPE].includes(source.type)||source.params.faceId!==p.sourceFaceId||source.params.regionId!==p.sourceRegionId)fail('INVALID_FEATURE_DEPENDENCY','Hole source identity differs from its authored selected profile.');
  }
  if(row.type==='WORKER_SOLID_EDGE_TREATMENT_V1'){const producer=parent(row,p.producerFeatureId);if(producer.type==='PLANE')fail('INVALID_FEATURE_DEPENDENCY','An edge treatment requires an authored solid producer.');row.sourceFeatureIds=producer.sourceFeatureIds.slice();}
 }
 return rows.map(row=>Object.freeze({...row,dependencies:Object.freeze(row.dependencies),sourceFeatureIds:Object.freeze(row.sourceFeatureIds)}));
}
export function assertActiveHistoryDependencies(rows){
 const byId=new Map(rows.map(r=>[r.featureId,r]));
 for(const row of rows)if(!row.suppressed)for(const id of row.dependencies)if(byId.get(id)?.suppressed)fail('ACTIVE_DEPENDENTS','Suppress active children explicitly before their parent.',{featureId:id,dependentFeatureIds:rows.filter(r=>!r.suppressed&&r.dependencies.includes(id)).map(r=>r.featureId)});
}
export function historyAnchorIndex(rows,id){if(id===null)return -1;const row=rows.find(r=>r.featureId===id);if(!row)fail('INVALID_FEATURE','Choose an inspected authored history anchor.');return row.index;}
export function planHistoryControl(history,pointer,rows,action,references){
 let next=history,nextPointer=pointer,kind=action.kind,delta={};
 if(kind==='feature-suppression'){
  if(pointer!==history.length-1)fail('UNAVAILABLE','Return to the full history tip before changing suppression.');
  const row=rows[action.index];if(!row||row.featureId!==action.featureId)fail('INVALID_FEATURE','The selected authored feature changed.');
  if(!SUPPRESSIBLE_FEATURE_TYPES.includes(row.type))fail('UNSUPPORTED_FEATURE','This constructor cannot be suppressed by the finite history capability.');
  if(row.suppressed===action.suppressed)return{changed:false};
  next=history.slice();const {suppressed,...active}=history[row.index];next[row.index]=action.suppressed?{...active,suppressed:true}:active;
  delta={index:row.index,featureId:row.featureId,operationType:row.type,beforeSuppressed:row.suppressed,afterSuppressed:action.suppressed};
  assertActiveHistoryDependencies(rows.map(r=>r===row?{...r,suppressed:action.suppressed}:r));
 }else if(kind==='history-position'){
  nextPointer=historyAnchorIndex(rows,action.afterFeatureId);if(pointer===nextPointer)return{changed:false};
 }else if(kind==='history-branch'){
  if(pointer===history.length-1)fail('NO_FUTURE_HISTORY','Select a genuine accepted prefix before committing a branch.');
  if(historyAnchorIndex(rows,action.afterFeatureId)!==pointer)fail('STALE_HISTORY','The branch anchor must match the current accepted prefix.');
  const suffix=history.slice(pointer+1);
  if(suffix.some(r=>r.type==='PLANE'))fail('BRANCH_SOURCE_OWNERSHIP','A branch cannot silently remove an independent source plane or its saved sketch.');
  if(!history.slice(0,pointer+1).some(op=>['WORKER_SOLID_BOX_V1','WORKER_SELECTED_PROFILE_EXTRUDE_V2',PROFILE_EXTENT_TYPE].includes(op.type)))fail('BRANCH_CONSTRUCTOR_REQUIRED','The retained prefix must keep an authored solid constructor and its exact backend binding.');
  next=history.slice(0,pointer+1);delta={suffix};
 }else fail('INVALID_REQUEST','Unknown history control.');
 if(kind!=='history-position')assertProtectedHistoryOutputs(rows,next,references);
 return{changed:true,kind,history:next,pointer:nextPointer,delta};
}
export function assertProtectedHistoryOutputs(rows,next,references){
 const byId=new Map(next.map(op=>[canonicalAuthoredFeatureId(op.params.featureId),op])),consumed=new Set(next.filter(op=>!featureSuppressed(op)&&['WORKER_THROUGH_HOLES_V1','WORKER_SOLID_EDGE_TREATMENT_V1'].includes(op.type)).map(op=>op.params.producerFeatureId));
 for(const ref of references){const row=byId.get(ref.featureId);if(!row||row.type!==ref.operationType||featureSuppressed(row)||consumed.has(ref.featureId))fail('REFERENCED_MANUFACTURING_OUTPUT','This history edit would remove an assigned producer. Rebind its material assignment explicitly first.',{featureId:ref.featureId});}
}
export function applyHistoryControlTravel(history,plan,direction){
 const e=plan.entry,undo=direction==='undo';let next=history;
 if(e.kind==='feature-suppression'){
  const current=history[e.index];if(!current||current.type!==e.operationType||canonicalAuthoredFeatureId(current.params.featureId)!==e.featureId)fail('STALE_HISTORY','The suppression target changed.');
  const {suppressed,...active}=current;next=history.slice();next[e.index]=(undo?e.beforeSuppressed:e.afterSuppressed)?{...active,suppressed:true}:active;
 }else if(e.kind==='history-branch')next=undo?[...history,...e.suffix]:history.slice(0,e.afterPointer+1);
 return{history:next,pointer:plan.pointer};
}
