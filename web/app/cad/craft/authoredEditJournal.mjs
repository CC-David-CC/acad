import {featureSuppressed} from '../../../../modules/engine/solid/authoredHistoryState.mjs';
import {isAuthoredLength,captureAuthoredHoleIntent} from '../../../../modules/engine/solid/authoredLengthBinding.mjs';
import {sourcePlaneDepth,boundedPlaneSource,planeRecord} from '../../sketcher/headless/sourcePlaneDepthEnvelope.mjs';
import {captureOwnedLoftFeature} from '../../../../modules/engine/solid/ownedLoftFeature.mjs';
import {captureOwnedSweepFeature} from '../../../../modules/engine/solid/ownedSweepFeature.mjs';
// Pure bounded journal: publication and full-pipeline replay belong to craft.
import {captureOwnedRevolveFeature} from '../../../../modules/engine/solid/ownedRevolveFeature.mjs';
import {solidBodyId,captureSolidBox,captureSolidBoolean} from '../../../../modules/engine/solid/solidIntent.mjs';
import {captureOwnedLinearHolePatternIntent,linearHolePatternNativeCost} from '../../../../modules/engine/solid/ownedLinearHolePatternIntent.mjs';
import {captureOwnedShellFeature} from '../../../../modules/engine/solid/ownedShellFeature.mjs';
import {captureDrivingDimensionIntent} from '../../sketcher/headless/drivingDimensionTarget.mjs';
import {captureLinkedPartDrawingDefinition} from '../../../../modules/drawing/linkedPartDrawingDefinition.mjs';
import {captureLinkedPartDrawingOperationRecord} from '../../../../modules/drawing/linkedPartDrawingOperation.mjs';
import {validateManufacturingMetadata} from '../projectManager/manufacturingMetadata.mjs';
import {readManufacturingWorkerPreparation} from '../projectManager/documentMetadataPreparation.mjs';
const LIMIT=64;
// Match the worker transition's native-source bound. The aggregate retained
// string budget below still evicts old entries; this is not an unbounded log.
const MAX_SKETCH_BYTES=1024*1024;
const MAX_JOURNAL_BYTES=8*1024*1024;
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const depth=n=>typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=1e6;
function checkRevision(n) { if(!integer(n,0,Number.MAX_SAFE_INTEGER-1))throw Error('Invalid authored revision.'); }
function checkIdentity(index,id) { if(!integer(index,0,255)||!integer(id,1,Number.MAX_SAFE_INTEGER))throw Error('Invalid feature identity.'); }
function make(document,revision,entries,cursor) {return Object.freeze({document,revision,entries:Object.freeze(entries),cursor});}
function bounded(entries) {
  entries=entries.slice(-LIMIT);
  let bytes=entries.reduce((sum,entry)=>sum+(['sketch-bytes','parameter-depth','parameter-bracket','physical-transaction','centered-parent-repair','selected-profile-depth','selected-profile-region','selected-profile-source-dimension','solid-edge-treatment','solid-shell','through-hole','linear-hole-pattern','operation-append','operation-remove','through-hole-parent','revolve-angle','source-plane-depth','document-metadata','feature-suppression','history-position','history-branch'].includes(entry.kind) ? entry.byteSize : 256),0);
  while(bytes>MAX_JOURNAL_BYTES && entries.length>1) {
    const removed=entries.shift();
    bytes-=['sketch-bytes','parameter-depth','parameter-bracket','physical-transaction','centered-parent-repair','selected-profile-depth','selected-profile-region','selected-profile-source-dimension','solid-edge-treatment','solid-shell','through-hole','linear-hole-pattern','operation-append','operation-remove','through-hole-parent','revolve-angle','source-plane-depth','document-metadata','feature-suppression','history-position','history-branch'].includes(removed.kind) ? removed.byteSize : 256;
  }
  if(bytes>MAX_JOURNAL_BYTES)throw Error('The authored edit exceeds the undo limit.');
  return entries;
}
export function emptyAuthoredEditJournal(document,revision) {
  if(!integer(document,0,Number.MAX_SAFE_INTEGER))throw Error('Invalid document generation.');
  checkRevision(revision);return make(document,revision,[],0);
}
function checkCurrent(state,document,revision) {
  checkRevision(revision);
  if(!state||state.document!==document||state.revision!==revision)throw Error('Authored edit history is stale.');
}
// A proposal, never installed until the caller publishes the evaluated model.
export function recordExtrusionEdit(state,{document,revision,index,featureId,before,after}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  if(!depth(before)||!depth(after)||before===after)throw Error('Invalid extrusion depth edit.');
  const entry=Object.freeze({kind:'extrusion-depth',index,featureId,before,after});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);
  return make(document,revision+1,entries,entries.length);
}
// The caller verifies the full-tip feature, evaluates its complete pipeline,
// and advances the returned state only in the successful atomic publication.
export function planExtrusionTravel(state,{document,revision,direction,index,featureId,currentDepth}) {
  checkCurrent(state,document,revision);
  if(direction!=='undo'&&direction!=='redo')throw Error('Invalid history direction.');
  const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='extrusion-depth')throw Error('No authored edit in that direction.');
  checkIdentity(index,featureId);
  const expected=direction==='undo'?entry.after:entry.before;
  if(entry.index!==index||entry.featureId!==featureId||currentDepth!==expected)throw Error('The authored feature no longer matches this edit.');
  const cursor=state.cursor+(direction==='undo'?-1:1);
  return Object.freeze({index,featureId,depth:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,cursor)});
}

const holeFields=kind=>kind==='centered'?['diameter']:kind==='corners'?['diameter','offsetX','offsetY']:null;
function holeDimensions(kind, value) {
  const fields=holeFields(kind);
  if(!fields || !value || typeof value!=='object' || Array.isArray(value) ||
     Reflect.ownKeys(value).length!==fields.length || fields.some(key=>{
       const property=Object.getOwnPropertyDescriptor(value,key);
       return !property?.enumerable || !Object.prototype.hasOwnProperty.call(property,'value') || !depth(property.value);
     })) throw Error('Invalid authored hole dimensions.');
  return Object.freeze(Object.fromEntries(fields.map(key=>[key,value[key]])));
}
export function recordHoleEdit(state,{document,revision,index,featureId,kind,before,after}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  const previous=holeDimensions(kind,before),next=holeDimensions(kind,after),fields=holeFields(kind);
  if(fields.every(key=>previous[key]===next[key]))throw Error('Invalid authored hole edit.');
  const entry=Object.freeze({kind:`hole-${kind}`,index,featureId,before:previous,after:next});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);
  return make(document,revision+1,entries,entries.length);
}
export function planHoleTravel(state,{document,revision,direction,index,featureId,currentDimensions}) {
  checkCurrent(state,document,revision);
  if(direction!=='undo'&&direction!=='redo')throw Error('Invalid history direction.');
  const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||!entry.kind.startsWith('hole-'))throw Error('No authored hole edit in that direction.');
  checkIdentity(index,featureId);
  const kind=entry.kind.slice(5),actual=holeDimensions(kind,currentDimensions);
  const expected=direction==='undo'?entry.after:entry.before;
  if(entry.index!==index||entry.featureId!==featureId||holeFields(kind).some(key=>actual[key]!==expected[key]))throw Error('The authored feature no longer matches this edit.');
  return Object.freeze({index,featureId,kind,dimensions:direction==='undo'?entry.before:entry.after,
    next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Only trusted sketch-edit preparation supplies these exact bytes. Storage
// key/version ownership and candidate replay are verified by craft, not here.
export function recordSketchEdit(state,{document,revision,faceId,before,after}) {
  checkCurrent(state,document,revision);
  if(typeof faceId!=='string'||!faceId||faceId.length>1024 || typeof before!=='string'||typeof after!=='string' ||
     before.length>MAX_SKETCH_BYTES||after.length>MAX_SKETCH_BYTES||before===after)throw Error('Invalid or oversized sketch edit.');
  const encoder=new TextEncoder(),beforeBytes=encoder.encode(before).byteLength,afterBytes=encoder.encode(after).byteLength;
  if(beforeBytes>MAX_SKETCH_BYTES||afterBytes>MAX_SKETCH_BYTES)throw Error('Invalid or oversized sketch edit.');
  // Charge conservatively for UTF-16 storage as well as serialized UTF-8.
  const byteSize=Math.max(beforeBytes,2*before.length)+Math.max(afterBytes,2*after.length)+Math.max(encoder.encode(faceId).byteLength,2*faceId.length);
  const entry=Object.freeze({kind:'sketch-bytes',faceId,before,after,byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);
  return make(document,revision+1,entries,entries.length);
}
export function planSketchTravel(state,{document,revision,direction,faceId,currentBytes}) {
  checkCurrent(state,document,revision);
  if(direction!=='undo'&&direction!=='redo')throw Error('Invalid history direction.');
  const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='sketch-bytes')throw Error('No authored sketch edit in that direction.');
  const expected=direction==='undo'?entry.after:entry.before;
  if(entry.faceId!==faceId||currentBytes!==expected)throw Error('The authored sketch no longer matches this edit.');
  return Object.freeze({faceId,bytes:direction==='undo'?entry.before:entry.after,
    next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Exact authored parameter source and one explicit extrusion binding; never
// stores evaluated geometry or engine handles.
const parameterBinding=value=>typeof value==='number'&&depth(value)||typeof value==='string'&&value.length<=128&&(/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(value)||/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())&&depth(Number(value)));
export function recordParameterDepthEdit(state,{document,revision,index,featureId,beforeSource,afterSource,beforeBinding,afterBinding}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  if(typeof beforeSource!=='string'||typeof afterSource!=='string'||beforeSource.length>65536||afterSource.length>65536||!parameterBinding(beforeBinding)||!parameterBinding(afterBinding)||(beforeSource===afterSource&&beforeBinding===afterBinding))throw Error('Invalid parameter edit.');
  const encoder=new TextEncoder(),a=encoder.encode(beforeSource).byteLength,b=encoder.encode(afterSource).byteLength;
  if(a>65536||b>65536)throw Error('Parameter source exceeds the journal limit.');
  const entry=Object.freeze({kind:'parameter-depth',index,featureId,beforeSource,afterSource,beforeBinding,afterBinding,byteSize:Math.max(a,2*beforeSource.length)+Math.max(b,2*afterSource.length)+512});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planParameterDepthTravel(state,{document,revision,direction,index,featureId,currentSource,currentBinding}) {
  checkCurrent(state,document,revision);if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='parameter-depth'||entry.index!==index||entry.featureId!==featureId||currentSource!==(direction==='undo'?entry.afterSource:entry.beforeSource)||currentBinding!==(direction==='undo'?entry.afterBinding:entry.beforeBinding))throw Error('The parameter binding no longer matches this edit.');
  return Object.freeze({source:direction==='undo'?entry.beforeSource:entry.afterSource,binding:direction==='undo'?entry.beforeBinding:entry.afterBinding,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

export function recordParameterBracketEdit(state,{document,revision,faceId,beforeSketch,afterSketch,beforeSource,afterSource,index,featureId,beforeOffsets,afterOffsets,depthIndex,depthFeatureId,beforeDepth,afterDepth}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);checkIdentity(depthIndex,depthFeatureId);
  if(typeof faceId!=='string'||!faceId||faceId.length>1024||[beforeSketch,afterSketch,beforeSource,afterSource].some(v=>typeof v!=='string'||v.length>65536)||!beforeOffsets||!afterOffsets||!['offsetX','offsetY'].every(k=>parameterBinding(beforeOffsets[k])&&parameterBinding(afterOffsets[k]))||!parameterBinding(beforeDepth)||!parameterBinding(afterDepth)||beforeSketch===afterSketch&&beforeSource===afterSource&&beforeOffsets.offsetX===afterOffsets.offsetX&&beforeOffsets.offsetY===afterOffsets.offsetY&&beforeDepth===afterDepth)throw Error('Invalid bracket parameter edit.');
  const encoder=new TextEncoder(),strings=[beforeSketch,afterSketch,beforeSource,afterSource],sizes=strings.map(v=>encoder.encode(v).byteLength);if(sizes.some(n=>n>65536))throw Error('Bracket parameter source exceeds journal limits.');
  const bindingStrings=[beforeOffsets.offsetX,beforeOffsets.offsetY,afterOffsets.offsetX,afterOffsets.offsetY,beforeDepth,afterDepth].filter(v=>typeof v==='string');
  const bindingBytes=bindingStrings.reduce((sum,v)=>sum+Math.max(encoder.encode(v).byteLength,2*v.length),0);
  const byteSize=strings.reduce((sum,v,i)=>sum+Math.max(sizes[i],2*v.length),Math.max(encoder.encode(faceId).byteLength,2*faceId.length)+512+bindingBytes);
  const entry=Object.freeze({kind:'parameter-bracket',faceId,index,featureId,depthIndex,depthFeatureId,beforeDepth,afterDepth,beforeSketch,afterSketch,beforeSource,afterSource,beforeOffsets:Object.freeze({offsetX:beforeOffsets.offsetX,offsetY:beforeOffsets.offsetY}),afterOffsets:Object.freeze({offsetX:afterOffsets.offsetX,offsetY:afterOffsets.offsetY}),byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planParameterBracketTravel(state,{document,revision,direction,faceId,index,featureId,currentSketch,currentSource,currentOffsets,currentDepth}) {
  checkCurrent(state,document,revision);if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor],forward=direction==='undo';
  if(!entry||entry.kind!=='parameter-bracket'||entry.faceId!==faceId||entry.index!==index||entry.featureId!==featureId||currentSketch!==(forward?entry.afterSketch:entry.beforeSketch)||currentSource!==(forward?entry.afterSource:entry.beforeSource)||currentDepth!==(forward?entry.afterDepth:entry.beforeDepth)||!['offsetX','offsetY'].every(k=>currentOffsets?.[k]===(forward?entry.afterOffsets:entry.beforeOffsets)[k]))throw Error('The bracket parameter bindings no longer match.');
  return Object.freeze({depthIndex:entry.depthIndex,depthFeatureId:entry.depthFeatureId,depth:forward?entry.beforeDepth:entry.afterDepth,sketch:forward?entry.beforeSketch:entry.afterSketch,source:forward?entry.beforeSource:entry.afterSource,offsets:forward?entry.beforeOffsets:entry.afterOffsets,next:make(document,revision+1,state.entries,state.cursor+(forward?-1:1))});
}

// General physical transaction: exact authored field changes and optional one
// solved sketch, with no model geometry, native handles or document copy.
export function recordPhysicalTransaction(state,{document,revision,beforeSource,afterSource,changes,sketches=[],parameterKind=undefined}) {
  checkCurrent(state,document,revision);
  if(typeof beforeSource!=='string'||typeof afterSource!=='string'||beforeSource.length>65536||afterSource.length>65536||!Array.isArray(changes)||changes.length>256||Reflect.ownKeys(changes).length!==changes.length+1)throw Error('Invalid physical transaction.');
  if(parameterKind!==undefined&&!['legacy-numeric-v1','typed-physical-v1'].includes(parameterKind))throw Error('Invalid expression source format.');
  const encoder=new TextEncoder(),measure=s=>{const bytes=encoder.encode(s).byteLength;if(bytes>65536)throw Error('Physical source exceeds journal limits.');return Math.max(bytes,s.length*2);};let byteSize=512+measure(beforeSource)+measure(afterSource);
  const seen=new Set(),items=[];for(let i=0;i<changes.length;i++){const d=Object.getOwnPropertyDescriptor(changes,String(i)),item=d?.value;if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||!item||typeof item!=='object'||Array.isArray(item)||Reflect.ownKeys(item).sort().join(',')!=='after,before,featureId,field,index,type')throw Error('Invalid physical binding change.');const copy={};for(const key of ['index','featureId','type','field','before','after']){const p=Object.getOwnPropertyDescriptor(item,key);if(!p?.enumerable||!Object.prototype.hasOwnProperty.call(p,'value'))throw Error('Invalid physical binding change.');copy[key]=p.value;}checkIdentity(copy.index,copy.featureId);if(typeof copy.type!=='string'||copy.type.length>128||typeof copy.field!=='string'||copy.field.length>128||!parameterBinding(copy.before)||!parameterBinding(copy.after)||copy.before===copy.after)throw Error('Invalid physical binding change.');const id=copy.index+':'+copy.field;if(seen.has(id))throw Error('Duplicate physical binding change.');seen.add(id);for(const value of [copy.type,copy.field,copy.before,copy.after])if(typeof value==='string')byteSize+=Math.max(encoder.encode(value).byteLength,value.length*2);byteSize+=128;items.push(Object.freeze(copy));}
  const input=sketches;if(!Array.isArray(input)||input.length>64||Reflect.ownKeys(input).length!==input.length+1)throw Error('Invalid physical sketch change.');const capturedSketches=[],faceIds=new Set();for(let i=0;i<input.length;i++){const item=Object.getOwnPropertyDescriptor(input,String(i));if(!item?.enumerable||!Object.hasOwn(item,'value'))throw Error('Invalid physical sketch change.');const value=item.value;if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).sort().join(',')!=='after,before,faceId')throw Error('Invalid physical sketch change.');const copy={};for(const key of ['faceId','before','after']){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string')throw Error('Invalid physical sketch change.');copy[key]=d.value;}if(!copy.faceId||copy.faceId.length>1024||faceIds.has(copy.faceId)||copy.before.length>1048576||copy.after.length>1048576||copy.before===copy.after)throw Error('Invalid physical sketch change.');faceIds.add(copy.faceId);const measureSketch=v=>{const size=encoder.encode(v).byteLength;if(size>1048576)throw Error('Physical sketch exceeds journal limits.');return Math.max(size,v.length*2)};byteSize+=measure(copy.faceId)+measureSketch(copy.before)+measureSketch(copy.after)+(capturedSketches.length?64:0);capturedSketches.push(Object.freeze(copy));}
  if(beforeSource===afterSource&&!items.length&&!capturedSketches.length)throw Error('The physical transaction is unchanged.');const frozen=Object.freeze(capturedSketches),entry=Object.freeze({kind:'physical-transaction',...(parameterKind===undefined?{}:{parameterKind}),beforeSource,afterSource,changes:Object.freeze(items),sketches:frozen,byteSize});const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planPhysicalTravel(state,{document,revision,direction,currentSource,history,readSketch}) {
  checkCurrent(state,document,revision);if(!['undo','redo'].includes(direction)||!Array.isArray(history)||typeof readSketch!=='function')throw Error('Invalid physical history request.');const undo=direction==='undo',entry=state.entries[undo?state.cursor-1:state.cursor];if(!entry||entry.kind!=='physical-transaction'||currentSource!==(undo?entry.afterSource:entry.beforeSource))throw Error('The physical source no longer matches.');
  for(const change of entry.changes){const request=history[change.index];if(!request||request.type!==change.type||Number(request.params?.featureId)!==change.featureId||request.params?.[change.field]!==change[undo?'after':'before'])throw Error('The physical binding no longer matches.');}
  const sketches=entry.sketches;for(const sketch of sketches)if(readSketch(sketch.faceId)!==sketch[undo?'after':'before'])throw Error('The physical sketch no longer matches.');const target=Object.freeze(sketches.map(sketch=>Object.freeze({faceId:sketch.faceId,data:sketch[undo?'before':'after']})));return Object.freeze({source:entry[undo?'beforeSource':'afterSource'],...(entry.parameterKind===undefined?{}:{parameterKind:entry.parameterKind}),changes:Object.freeze(entry.changes.map(c=>Object.freeze({...c,value:c[undo?'before':'after']}))),sketches:target,next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}

// A repair records only authored identities, never a candidate model or handle.
export function recordCenteredParentRepair(state,{document,revision,index,featureId,before,after}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  if([before,after].some(id=>typeof id!=='string'||!id||id.length>1024)||before===after)throw Error('Invalid centered-hole parent repair.');
  const byteSize=256+2*(before.length+after.length);
  const entry=Object.freeze({kind:'centered-parent-repair',index,featureId,before,after,byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);
  return make(document,revision+1,entries,entries.length);
}
export function planCenteredParentRepairTravel(state,{document,revision,direction,index,featureId,currentFace}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');
  const undo=direction==='undo',entry=state.entries[undo?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='centered-parent-repair'||entry.index!==index||entry.featureId!==featureId||currentFace!==(undo?entry.after:entry.before))throw Error('The repaired parent no longer matches this edit.');
  return Object.freeze({face:undo?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}

const solidBoxKeys=Object.freeze(['x','y','z','width','depth','height']);
function solidBoxValues(input) {
 if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==solidBoxKeys.length)throw Error('Invalid solid box dimensions.');
 const result={};for(const key of solidBoxKeys){const d=Object.getOwnPropertyDescriptor(input,key),v=d?.value;if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value')||typeof v!=='number'||!Number.isFinite(v)||(['x','y','z'].includes(key)?Math.abs(v)>1e6:v<=0||v>1e6))throw Error('Invalid solid box dimensions.');result[key]=v;}return Object.freeze(result);
}
export function recordSolidBoxEdit(state,{document,revision,index,featureId,engine,engineRevision,before,after}) {
 checkCurrent(state,document,revision);checkIdentity(index,featureId);if(!['occ','manifold','smlib'].includes(engine)||typeof engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(engineRevision))throw Error('Invalid solid engine.');
 const previous=solidBoxValues(before),next=solidBoxValues(after);if(solidBoxKeys.every(k=>Object.is(previous[k],next[k])))throw Error('Unchanged solid box.');
 const entry=Object.freeze({kind:'solid-box',index,featureId,engine,engineRevision,before:previous,after:next});const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planSolidBoxTravel(state,{document,revision,direction,index,featureId,engine,engineRevision,current}) {
 checkCurrent(state,document,revision);checkIdentity(index,featureId);if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');
 const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor],actual=solidBoxValues(current),expected=direction==='undo'?entry?.after:entry?.before;
 if(!entry||entry.kind!=='solid-box'||entry.index!==index||entry.featureId!==featureId||entry.engine!==engine||entry.engineRevision!==engineRevision||solidBoxKeys.some(k=>!Object.is(actual[k],expected[k])))throw Error('The authored solid no longer matches this edit.');
 return Object.freeze({values:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Selected-profile depth is an authored scalar edit, distinct from rectangle
// length. Retain immutable selection/runtime identity, never derived geometry.
const selectedProfileKeys=['version','unit','engine','engineRevision','featureId','faceId','regionId','depth','bodyPolicy'];
const selectedIdentityKeys=selectedProfileKeys.filter(key=>!['featureId','depth'].includes(key));
export function captureSelectedProfileDepthParameters(value) {
  const prototype=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(prototype!==null&&Object.getPrototypeOf(prototype)!==null)||Reflect.ownKeys(value).length!==selectedProfileKeys.length)throw Error('Invalid selected-profile depth parameters.');
  const result={};
  for(const key of selectedProfileKeys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.prototype.hasOwnProperty.call(d,'value'))throw Error('Selected-profile depth parameters must be data.');result[key]=d.value;}
  if(result.version!==1||result.unit!=='millimeter'||result.engine!=='occ'||typeof result.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(result.engineRevision)||!integer(result.featureId,1,Number.MAX_SAFE_INTEGER)||typeof result.faceId!=='string'||!result.faceId||result.faceId.length>256||typeof result.regionId!=='string'||!result.regionId.startsWith('sketch-region:')||result.regionId.length>8192||result.bodyPolicy!=='separate'||!isAuthoredLength(result.depth))throw Error('Invalid selected-profile depth parameters.');
  return Object.freeze(result);
}
export function recordSelectedProfileDepthEdit(state,{document,revision,index,featureId,parameters,after}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  const current=captureSelectedProfileDepthParameters(parameters);
  if(current.featureId!==featureId||typeof current.depth!=='number'||!depth(after)||current.depth===after)throw Error('Invalid selected-profile depth edit.');
  const identity=Object.freeze(Object.fromEntries(selectedIdentityKeys.map(key=>[key,current[key]])));
  const text=JSON.stringify(identity),byteSize=256+Math.max(2*text.length,new TextEncoder().encode(text).byteLength);
  const entry=Object.freeze({kind:'selected-profile-depth',index,featureId,identity,before:current.depth,after,byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);
  return make(document,revision+1,entries,entries.length);
}
export function planSelectedProfileDepthTravel(state,{document,revision,direction,index,featureId,parameters}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  if(direction!=='undo'&&direction!=='redo')throw Error('Invalid history direction.');
  const current=captureSelectedProfileDepthParameters(parameters),entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='selected-profile-depth')throw Error('No selected-profile depth edit in that direction.');
  const expected=direction==='undo'?entry.after:entry.before;
  if(entry.index!==index||entry.featureId!==featureId||current.featureId!==featureId||current.depth!==expected||selectedIdentityKeys.some(key=>entry.identity[key]!==current[key]))throw Error('The selected-profile feature no longer matches this edit.');
  return Object.freeze({index,featureId,depth:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Region reselection keeps the feature/runtime/source/depth identity. The
// normal prepared replay proves membership and compatible dependents.
const selectedRegionIdentityKeys=selectedProfileKeys.filter(key=>!['featureId','regionId'].includes(key));
export function recordSelectedProfileRegionEdit(state,{document,revision,index,featureId,parameters,after}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  const current=captureSelectedProfileDepthParameters(parameters),next=captureSelectedProfileDepthParameters({...current,regionId:after});
  if(current.featureId!==featureId||next.regionId===current.regionId)throw Error('Invalid selected-profile region edit.');
  const identity=Object.freeze(Object.fromEntries(selectedRegionIdentityKeys.map(key=>[key,current[key]])));
  const encoder=new TextEncoder(),charge=text=>Math.max(2*text.length,encoder.encode(text).byteLength);
  const byteSize=256+charge(JSON.stringify(identity))+charge(current.regionId)+charge(next.regionId);
  const entry=Object.freeze({kind:'selected-profile-region',index,featureId,identity,before:current.regionId,after:next.regionId,byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planSelectedProfileRegionTravel(state,{document,revision,direction,index,featureId,parameters}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);if(direction!=='undo'&&direction!=='redo')throw Error('Invalid history direction.');
  const current=captureSelectedProfileDepthParameters(parameters),entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='selected-profile-region')throw Error('No selected-profile region edit in that direction.');
  const expected=direction==='undo'?entry.after:entry.before;
  if(entry.index!==index||entry.featureId!==featureId||current.featureId!==featureId||current.regionId!==expected||selectedRegionIdentityKeys.some(key=>entry.identity[key]!==current[key]))throw Error('The selected-profile feature no longer matches this region edit.');
  return Object.freeze({index,featureId,regionId:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// One source dimension and the SAME extrusion's region are one authored edit.
// No candidate geometry, model, full history or opaque proposal cache is saved.
export function captureSelectedProfileSourceDimensionEdit(value) {
  const keys=['index','featureId','parameters','before','after','regionId','dimension'];
  const p=value&&typeof value==='object'?Object.getPrototypeOf(value):undefined;
  if(!value||typeof value!=='object'||Array.isArray(value)||(p!==null&&Object.getPrototypeOf(p)!==null)||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid selected-profile source edit.');
  const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Selected-profile source fields must be data.');out[key]=d.value;}
  checkIdentity(out.index,out.featureId);out.parameters=captureSelectedProfileDepthParameters(out.parameters);
  if(out.parameters.featureId!==out.featureId)throw Error('The selected-profile producer changed.');
  captureSelectedProfileDepthParameters({...out.parameters,regionId:out.regionId});
  const encoder=new TextEncoder();for(const key of ['before','after'])if(typeof out[key]!=='string'||!out[key]||out[key].length>65536||encoder.encode(out[key]).byteLength>65536)throw Error('Selected-profile source exceeds64KiB.');
  if(out.before===out.after)throw Error('A combined source edit requires an actual source dimension change.');
  out.dimension=captureDrivingDimensionIntent(out.dimension,'edit');if(typeof out.dimension.value!=='number')throw Error('Combined source edits require literal canonical millimeters.');
  return Object.freeze(out);
}
export function recordSelectedProfileSourceDimensionEdit(state,input) {
  const keys=['document','revision','index','featureId','parameters','before','after','regionId','dimension'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==keys.length)throw Error('Invalid combined source journal request.');
  const values={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Combined source journal fields must be data.');values[key]=d.value;}
  const {document,revision,...request}=values;checkCurrent(state,document,revision);const captured=captureSelectedProfileSourceDimensionEdit(request),encoder=new TextEncoder();
  const charge=s=>Math.max(s.length*2,encoder.encode(s).byteLength);
  const byteSize=768+charge(captured.before)+charge(captured.after)+charge(captured.regionId)+charge(JSON.stringify(captured.parameters))+charge(JSON.stringify(captured.dimension));
  const entry=Object.freeze({kind:'selected-profile-source-dimension',...captured,byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planSelectedProfileSourceDimensionTravel(state,{document,revision,direction,index,featureId,parameters,currentSketch}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);if(!['undo','redo'].includes(direction))throw Error('Invalid source-dimension travel direction.');
  const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor],current=captureSelectedProfileDepthParameters(parameters),undo=direction==='undo';
  if(!entry||entry.kind!=='selected-profile-source-dimension'||entry.index!==index||entry.featureId!==featureId||current.featureId!==featureId||currentSketch!==entry[undo?'after':'before']||selectedProfileKeys.some(key=>current[key]!== (key==='regionId'&&undo?entry.regionId:entry.parameters[key])))throw Error('The combined selected-profile source edit is stale.');
  return Object.freeze({index,featureId,parameters:current,before:currentSketch,after:entry[undo?'before':'after'],regionId:undo?entry.parameters.regionId:entry.regionId,dimension:entry.dimension,next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}

// Numeric edge-treatment size is a scalar edit of one immutable authored
// selection/operand/build. Native handles and local indices are never journaled.
const solidTreatmentKeys=['version','unit','engine','engineRevision','featureId','target','producerFeatureId','kind','edgeIds','size'];
const solidTreatmentIdentityKeys=solidTreatmentKeys.filter(key=>!['featureId','size'].includes(key));
export function captureSolidEdgeTreatmentParameters(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==solidTreatmentKeys.length)throw Error('Invalid solid edge-treatment parameters.');
  const result={};for(const key of solidTreatmentKeys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Solid edge-treatment parameters must be data.');result[key]=d.value;}
  if(result.version!==1||result.unit!=='millimeter'||result.engine!=='occ'||typeof result.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(result.engineRevision)||!integer(result.featureId,1,Number.MAX_SAFE_INTEGER)||!integer(result.producerFeatureId,1,Number.MAX_SAFE_INTEGER)||result.featureId===result.producerFeatureId||result.target!==solidBodyId(result.producerFeatureId)||!['fillet','chamfer-equal'].includes(result.kind)||!depth(result.size))throw Error('Invalid authored edge treatment.');
  const ids=result.edgeIds;if(!Array.isArray(ids)||ids.length<1||ids.length>16||Reflect.ownKeys(ids).length!==ids.length+1)throw Error('Select one to sixteen authored edges.');
  const copied=[];for(let i=0;i<ids.length;i++){const d=Object.getOwnPropertyDescriptor(ids,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!d.value||d.value.length>16384)throw Error('Edge identities must be bounded data strings.');copied.push(d.value);}
  if(new Set(copied).size!==copied.length)throw Error('Select distinct authored edges.');result.edgeIds=Object.freeze(copied);return Object.freeze(result);
}
function solidTreatmentIdentityBytes(identity) {
  // Count the same serialized identity as the other scalar journals, in
  // bounded field/ID fragments rather than allocating a large joined string.
  const encoder=new TextEncoder();let units=0,bytes=0;
  const add=text=>{units+=text.length;bytes+=encoder.encode(text).byteLength;};
  add('{');solidTreatmentIdentityKeys.forEach((key,i)=>{if(i)add(',');add(JSON.stringify(key)+':');if(key==='edgeIds'){add('[');identity.edgeIds.forEach((id,j)=>{if(j)add(',');add(JSON.stringify(id));});add(']');}else add(JSON.stringify(identity[key]));});add('}');
  return 256+Math.max(2*units,bytes);
}
export function recordSolidEdgeTreatmentEdit(state,{document,revision,index,featureId,parameters,after}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  const current=captureSolidEdgeTreatmentParameters(parameters);
  if(current.featureId!==featureId||!depth(after)||current.size===after)throw Error('Invalid solid edge-treatment size edit.');
  const identity=Object.freeze(Object.fromEntries(solidTreatmentIdentityKeys.map(key=>[key,current[key]]))),byteSize=solidTreatmentIdentityBytes(identity);
  const entry=Object.freeze({kind:'solid-edge-treatment',index,featureId,identity,before:current.size,after,byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planSolidEdgeTreatmentTravel(state,{document,revision,direction,index,featureId,parameters}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');
  const current=captureSolidEdgeTreatmentParameters(parameters),entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='solid-edge-treatment')throw Error('No solid edge-treatment edit in that direction.');
  const expected=direction==='undo'?entry.after:entry.before;
  if(entry.index!==index||entry.featureId!==featureId||current.featureId!==featureId||current.size!==expected||solidTreatmentIdentityKeys.some(key=>key==='edgeIds'?entry.identity.edgeIds.length!==current.edgeIds.length||entry.identity.edgeIds.some((id,i)=>id!==current.edgeIds[i]):entry.identity[key]!==current[key]))throw Error('The authored edge treatment no longer matches this edit.');
  return Object.freeze({index,featureId,size:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Thickness is the only mutable field of this source/selection/build identity.
const shellKeys=['version','unit','engine','engineRevision','featureId','target','producerFeatureId','removedFaceIds','thickness','direction'];
const shellIdentityKeys=shellKeys.filter(key=>!['featureId','thickness'].includes(key));
export const captureSolidShellParameters=captureOwnedShellFeature;
function shellIdentityBytes(identity){
 const encoder=new TextEncoder();let units=0,bytes=0;const add=text=>{units+=text.length;bytes+=encoder.encode(text).byteLength;};
 add('{');shellIdentityKeys.forEach((key,i)=>{if(i)add(',');add(JSON.stringify(key)+':');if(key==='removedFaceIds'){add('[');identity.removedFaceIds.forEach((id,j)=>{if(j)add(',');add(JSON.stringify(id));});add(']');}else add(JSON.stringify(identity[key]));});add('}');
 return 256+Math.max(2*units,bytes);
}
export function recordSolidShellEdit(state,{document,revision,index,featureId,parameters,after}){
 checkCurrent(state,document,revision);checkIdentity(index,featureId);const current=captureOwnedShellFeature(parameters);
 if(current.featureId!==featureId||!depth(after)||current.thickness===after)throw Error('Invalid authored shell thickness edit.');
 const identity=Object.freeze(Object.fromEntries(shellIdentityKeys.map(key=>[key,current[key]]))),entry=Object.freeze({kind:'solid-shell',index,featureId,identity,before:current.thickness,after,byteSize:shellIdentityBytes(identity)});
 const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planSolidShellTravel(state,{document,revision,direction,index,featureId,parameters}){
 checkCurrent(state,document,revision);checkIdentity(index,featureId);if(!['undo','redo'].includes(direction))throw Error('Invalid shell history direction.');
 const current=captureOwnedShellFeature(parameters),entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
 if(!entry||entry.kind!=='solid-shell'||entry.index!==index||entry.featureId!==featureId||current.featureId!==featureId||current.thickness!==(direction==='undo'?entry.after:entry.before)||shellIdentityKeys.some(key=>key==='removedFaceIds'?entry.identity[key].length!==current[key].length||entry.identity[key].some((id,i)=>id!==current[key][i]):entry.identity[key]!==current[key]))throw Error('The authored shell no longer matches this thickness edit.');
 return Object.freeze({index,featureId,thickness:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// One authored append in this same chronology. The caller owns prefix/history
// identity, graph validity, candidate replay and atomic publication; this delta
// stores neither a history snapshot nor evaluated/native geometry.
function appendData(value,keys) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)throw Error('Invalid operation-append data.');
  const result={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Operation-append fields must be own data.');result[key]=d.value;}return result;
}
const solidAppendCommon=['version','unit','engine','engineRevision','featureId'];
const solidAppendBoxKeys=[...solidAppendCommon,'x','y','z','width','depth','height'];
const solidAppendBooleanKeys=[...solidAppendCommon,'kind','a','b'];
const loftKeys=[...solidAppendCommon,'sections','construction','bodyPolicy'];
const sweepKeys=[...solidAppendCommon,'faceId','regionId','pathFaceId','pathCurves','transport','bodyPolicy'];
const revolveKeys=[...solidAppendCommon,'faceId','regionId','axisSegmentId','angleRadians','bodyPolicy'];
function captureSolidAppendParameters(value,box) {
  const params=appendData(value,box?solidAppendBoxKeys:solidAppendBooleanKeys);
  if(box){
    const {x,y,z,width,depth,height,...common}=params;
    // Validate through the same authored solid contract, retaining the flat
    // saved feature representation rather than evaluated geometry or handles.
    captureSolidBox({...common,origin:[x,y,z],dimensions:[width,depth,height]});
  }else captureSolidBoolean(params);
  return Object.freeze(params);
}
export function supportsOperationAppend(type){return typeof type==='string'&&Object.hasOwn(appendDefinitions,type);}
export function captureOperationAppend(request) {
 const suppressed=featureSuppressed(request),captured=appendData(request,suppressed?['type','params','suppressed']:['type','params']);
 if(!supportsOperationAppend(captured.type))throw Error('Unsupported authored operation append.');
 return Object.freeze({type:captured.type,params:appendDefinitions[captured.type].capture(captured.params),...(suppressed?{suppressed:true}:{})});
}
function checkAppendIdentity(index,featureId,previousFeatureId) {
  if(!integer(index,0,9999)||!integer(featureId,1,Number.MAX_SAFE_INTEGER)||(index===0?previousFeatureId!==null:!integer(previousFeatureId,1,Number.MAX_SAFE_INTEGER))||featureId===previousFeatureId)throw Error('Invalid operation-append feature relationship.');
}
const appendKeys=(type,params)=>{const keys=appendDefinitions[type].keys;return typeof keys==='function'?keys(params):keys;};
function operationAppendBytes(operation) {
  const encoder=new TextEncoder();let units=0,bytes=0;
  const add=text=>{units+=text.length;bytes+=encoder.encode(text).byteLength;};
  // JSON escaping is measured in small fragments. Preserve surrogate pairs at
  // boundaries so their combined UTF-8/UTF-16 charge is exact. No full request
  // or 16 KiB edge ID is serialized/encoded as one large temporary string.
  const string=value=>{add('"');for(let start=0;start<value.length;){let end=Math.min(start+1024,value.length);if(end<value.length&&value.charCodeAt(end-1)>=0xd800&&value.charCodeAt(end-1)<=0xdbff&&value.charCodeAt(end)>=0xdc00&&value.charCodeAt(end)<=0xdfff)end--;add(JSON.stringify(value.slice(start,end)).slice(1,-1));start=end;}add('"');};
  add('{"type":');string(operation.type);add(',"params":{');
  appendKeys(operation.type,operation.params).forEach((key,i)=>{if(i)add(',');string(key);add(':');const value=operation.params[key];if(key==='sections'){add('[');value.forEach((section,j)=>{if(j)add(',');add('{"faceId":');string(section.faceId);add(',"regionId":');string(section.regionId);add(',"seam":{"kind":');string(section.seam.kind);if(section.seam.kind==='vertex'){add(',"pointId":');string(section.seam.pointId);}else{add(',"curveId":');string(section.seam.curveId);add(',"angleRadians":');add(JSON.stringify(section.seam.angleRadians));}add(',"reversed":');add(String(section.seam.reversed));add('}}');});add(']');}else if(key==='pathCurves'){add('[');value.forEach((ref,j)=>{if(j)add(',');add('{\"curveId\":');string(ref.curveId);add(',\"reversed\":');add(String(ref.reversed));add('}');});add(']');}else if(key==='edgeIds'||key==='removedFaceIds'){add('[');value.forEach((id,j)=>{if(j)add(',');string(id);});add(']');}else if(typeof value==='string')string(value);else add(String(value));});
  add('}');if(featureSuppressed(operation))add(',"suppressed":true');add('}');return 256+Math.max(2*units,bytes);
}
export function recordOperationAppend(state,input) {
  const {document,revision,index,operation,previousFeatureId}=appendData(input,['document','revision','index','operation','previousFeatureId']);
  checkCurrent(state,document,revision);const captured=captureOperationAppend(operation),featureId=captured.params.featureId;
  checkAppendIdentity(index,featureId,previousFeatureId);
  const entry=Object.freeze({kind:'operation-append',index,featureId,previousFeatureId,operation:captured,byteSize:operationAppendBytes(captured)});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
// Both arguments have already passed the exact authored capture. Compare
// source/seam identity by value across normal native-file JSON round trips.
function sameLoftSections(a,b){return a.length===b.length&&a.every((section,i)=>{const other=b[i],seam=section.seam,next=other.seam;return section.faceId===other.faceId&&section.regionId===other.regionId&&seam.kind===next.kind&&seam.reversed===next.reversed&&(seam.kind==='vertex'?seam.pointId===next.pointId:seam.curveId===next.curveId&&seam.angleRadians===next.angleRadians);});}
export function planOperationAppendTravel(state,input) {
  const {document,revision,direction,index,featureId,currentLength,currentOperation,previousFeatureId}=appendData(input,['document','revision','direction','index','featureId','currentLength','currentOperation','previousFeatureId']);
  checkCurrent(state,document,revision);checkAppendIdentity(index,featureId,previousFeatureId);
  if(!['undo','redo'].includes(direction)||!integer(currentLength,0,10000))throw Error('Invalid operation-append travel.');
  const undo=direction==='undo',entry=state.entries[undo?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='operation-append'||entry.index!==index||entry.featureId!==featureId||entry.previousFeatureId!==previousFeatureId||currentLength!==(undo?index+1:index))throw Error('The authored append no longer matches this history tip.');
  if(undo){
    const current=captureOperationAppend(currentOperation),expected=entry.operation.params;
    if(current.type!==entry.operation.type||featureSuppressed(current)!==featureSuppressed(entry.operation)||appendKeys(current.type,current.params).some(key=>key==='sections'?!sameLoftSections(current.params.sections,expected.sections):key==='pathCurves'?current.params.pathCurves.length!==expected.pathCurves.length||current.params.pathCurves.some((ref,i)=>ref.curveId!==expected.pathCurves[i].curveId||ref.reversed!==expected.pathCurves[i].reversed):(key==='edgeIds'||key==='removedFaceIds')?current.params[key].length!==expected[key].length||current.params[key].some((id,i)=>id!==expected[key][i]):!Object.is(current.params[key],expected[key])))throw Error('The authored operation no longer matches this append.');
  }else if(currentOperation!==null)throw Error('Redo requires an absent appended operation.');
  return Object.freeze({index,featureId,operation:entry.operation,next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}

// Source-bound through-hole numeric edits reuse the same authored journal.
// Source/target/backend identity stays exact; tools and geometry are not stored.
const throughHoleIdentityKeys=Object.freeze(['version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','kind']);
const throughHoleDimensionKind=kind=>kind==='centered-through'?'centered':kind==='four-corner-through'?'corners':null;
export function captureThroughHoleParameters(value) {return captureAuthoredHoleIntent(value);}
function currentThroughHoleDimensions(parameters) {
  const kind=throughHoleDimensionKind(parameters.kind),fields=holeFields(kind);
  return holeDimensions(kind,Object.fromEntries(fields.map(key=>[key,parameters[key]])));
}
export function recordThroughHoleEdit(state,{document,revision,index,featureId,parameters,after}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  const current=captureThroughHoleParameters(parameters),kind=throughHoleDimensionKind(current.kind);
  const before=currentThroughHoleDimensions(current),next=holeDimensions(kind,after);
  if(current.featureId!==featureId||holeFields(kind).every(key=>before[key]===next[key]))throw Error('Invalid source-bound through-hole edit.');
  const identity=Object.freeze(Object.fromEntries(throughHoleIdentityKeys.map(key=>[key,current[key]])));
  const encoder=new TextEncoder(),measure=value=>{const text=JSON.stringify(value);return Math.max(text.length*2,encoder.encode(text).byteLength);};
  const byteSize=256+measure(identity)+measure(before)+measure(next);
  const entry=Object.freeze({kind:'through-hole',index,featureId,identity,before,after:next,byteSize});
  const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planThroughHoleTravel(state,{document,revision,direction,index,featureId,parameters}) {
  checkCurrent(state,document,revision);checkIdentity(index,featureId);
  if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');
  const current=captureThroughHoleParameters(parameters),actual=currentThroughHoleDimensions(current),entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
  if(!entry||entry.kind!=='through-hole')throw Error('No source-bound through-hole edit in that direction.');
  const expected=direction==='undo'?entry.after:entry.before;
  if(entry.index!==index||entry.featureId!==featureId||current.featureId!==featureId||throughHoleIdentityKeys.some(key=>entry.identity[key]!==current[key])||holeFields(throughHoleDimensionKind(current.kind)).some(key=>actual[key]!==expected[key]))throw Error('The source-bound through-hole feature no longer matches this edit.');
  return Object.freeze({index,featureId,dimensions:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Semantic pattern edits retain the exact authenticated seed/target/axis/build.
const linearPatternKeys=['version','unit','engine','engineRevision','featureId','target','producerFeatureId','seedFeatureId','axis','count','spacing'];
const linearPatternIdentityKeys=linearPatternKeys.filter(key=>!['count','spacing'].includes(key));
export function captureLinearHolePatternParameters(value) {
 const result=captureOwnedLinearHolePatternIntent(value);linearHolePatternNativeCost(result.count);return result;
}
const patternDimensions=value=>{const data=appendData(value,['count','spacing']);linearHolePatternNativeCost(data.count);if(!depth(data.spacing))throw Error('Invalid pattern spacing.');return Object.freeze(data);};
export function recordLinearHolePatternEdit(state,{document,revision,index,featureId,parameters,after}) {
 checkCurrent(state,document,revision);checkIdentity(index,featureId);
 const current=captureLinearHolePatternParameters(parameters),before=patternDimensions({count:current.count,spacing:current.spacing}),next=patternDimensions(after);
 if(current.featureId!==featureId||before.count===next.count&&before.spacing===next.spacing)throw Error('Invalid linear-hole-pattern edit.');
 const identity=Object.freeze(Object.fromEntries(linearPatternIdentityKeys.map(key=>[key,current[key]])));
 const encoder=new TextEncoder(),measure=v=>{const text=JSON.stringify(v);return Math.max(text.length*2,encoder.encode(text).byteLength);};
 const entry=Object.freeze({kind:'linear-hole-pattern',index,featureId,identity,before,after:next,byteSize:256+measure(identity)+measure(before)+measure(next)});
 const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planLinearHolePatternTravel(state,{document,revision,direction,index,featureId,parameters}) {
 checkCurrent(state,document,revision);checkIdentity(index,featureId);if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');
 const current=captureLinearHolePatternParameters(parameters),entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
 if(!entry||entry.kind!=='linear-hole-pattern')throw Error('No linear-hole-pattern edit in that direction.');
 const expected=direction==='undo'?entry.after:entry.before;
 if(entry.index!==index||entry.featureId!==featureId||linearPatternIdentityKeys.some(key=>entry.identity[key]!==current[key])||current.count!==expected.count||current.spacing!==expected.spacing)throw Error('The authored linear pattern no longer matches this edit.');
 return Object.freeze({index,featureId,dimensions:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Scalar revolve edits retain the complete source/axis/build identity in this
// same journal. Candidate replay and source/native proof remain Craft-owned.
export function recordRevolveAngleEdit(state,{document,revision,index,featureId,parameters,after}) {
 checkCurrent(state,document,revision);checkIdentity(index,featureId);
 const current=captureOwnedRevolveFeature(parameters),next=captureOwnedRevolveFeature({...current,angleRadians:after});
 if(current.featureId!==featureId||Object.is(current.angleRadians,after))throw Error('Invalid revolve angle edit.');
 const identity=Object.freeze(Object.fromEntries(revolveKeys.filter(k=>k!=='angleRadians').map(k=>[k,current[k]])));
 const byteSize=operationAppendBytes({type:'WORKER_SELECTED_PROFILE_REVOLVE_V1',params:current})+operationAppendBytes({type:'WORKER_SELECTED_PROFILE_REVOLVE_V1',params:next});
 const entry=Object.freeze({kind:'revolve-angle',index,featureId,identity,before:current.angleRadians,after,byteSize});
 const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planRevolveAngleTravel(state,{document,revision,direction,index,featureId,parameters}) {
 checkCurrent(state,document,revision);checkIdentity(index,featureId);
 if(!['undo','redo'].includes(direction))throw Error('Invalid revolve angle travel.');
 const current=captureOwnedRevolveFeature(parameters),entry=state.entries[direction==='undo'?state.cursor-1:state.cursor];
 if(!entry||entry.kind!=='revolve-angle'||entry.index!==index||entry.featureId!==featureId||current.featureId!==featureId||!Object.is(current.angleRadians,direction==='undo'?entry.after:entry.before)||revolveKeys.some(k=>k!=='angleRadians'&&!Object.is(current[k],entry.identity[k])))throw Error('The revolve no longer matches this edit.');
 return Object.freeze({index,featureId,angleRadians:direction==='undo'?entry.before:entry.after,next:make(document,revision+1,state.entries,state.cursor+(direction==='undo'?-1:1))});
}

// Capture and Craft chronology admission use one closed local registry.
const appendDefinitions=Object.freeze({
 WORKER_SELECTED_PROFILE_EXTRUDE_V2:{capture:captureSelectedProfileDepthParameters,keys:selectedProfileKeys},
 WORKER_THROUGH_HOLES_V1:{capture:captureThroughHoleParameters,keys:params=>[...throughHoleIdentityKeys,'diameter',...(params.kind==='four-corner-through'?['offsetX','offsetY']:[])]},
 WORKER_SELECTED_PROFILE_LOFT_V1:{capture:captureOwnedLoftFeature,keys:loftKeys},
 WORKER_SELECTED_PROFILE_SWEEP_V1:{capture:captureOwnedSweepFeature,keys:sweepKeys},
 WORKER_SELECTED_PROFILE_REVOLVE_V1:{capture:captureOwnedRevolveFeature,keys:revolveKeys},
 WORKER_SOLID_BOX_V1:{capture:value=>captureSolidAppendParameters(value,true),keys:solidAppendBoxKeys},
 WORKER_SOLID_BOOLEAN_V1:{capture:value=>captureSolidAppendParameters(value,false),keys:solidAppendBooleanKeys},
 WORKER_SOLID_EDGE_TREATMENT_V1:{capture:captureSolidEdgeTreatmentParameters,keys:solidTreatmentKeys},
 WORKER_SOLID_SHELL_V1:{capture:captureOwnedShellFeature,keys:shellKeys},
 WORKER_LINEAR_HOLE_PATTERN_V1:{capture:captureLinearHolePatternParameters,keys:linearPatternKeys}
});

// One placement field and its exact derived source witness, never model state.
function planeEditIdentity(value){
 const r=planeRecord(value,['index','featureId','faceId','orientation']);checkIdentity(r.index,r.featureId);
 if(typeof r.faceId!=='string'||!r.faceId||r.faceId.length>256||!['XY','XZ','ZY'].includes(r.orientation))throw Error('Invalid source-plane identity.');return Object.freeze(r);
}
export function recordSourcePlaneDepthEdit(state,{document,revision,identity,beforeDepth,afterDepth,before,after}){
 checkCurrent(state,document,revision);const id=planeEditIdentity(identity);boundedPlaneSource(before);boundedPlaneSource(after);
 if(!sourcePlaneDepth(beforeDepth)||!sourcePlaneDepth(afterDepth)||beforeDepth===afterDepth||before===after)throw Error('Invalid source-plane depth edit.');
 const measure=v=>Math.max(new TextEncoder().encode(v).byteLength,2*v.length),byteSize=512+measure(before)+measure(after)+measure(id.faceId);
 const entry=Object.freeze({kind:'source-plane-depth',...id,beforeDepth,afterDepth,before,after,byteSize}),entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planSourcePlaneDepthTravel(state,{document,revision,direction,identity,currentDepth,currentSketch}){
 checkCurrent(state,document,revision);const id=planeEditIdentity(identity);if(!['undo','redo'].includes(direction))throw Error('Invalid history direction.');
 const undo=direction==='undo',entry=state.entries[undo?state.cursor-1:state.cursor];
 if(!entry||entry.kind!=='source-plane-depth'||['index','featureId','faceId','orientation'].some(k=>entry[k]!==id[k])||currentDepth!==entry[undo?'afterDepth':'beforeDepth']||currentSketch!==entry[undo?'after':'before'])throw Error('The source-plane placement no longer matches this edit.');
 return Object.freeze({identity:id,depth:entry[undo?'beforeDepth':'afterDepth'],sketch:entry[undo?'before':'after'],next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}

// Component-only metadata proposals for this SAME journal. Publication must
// jointly install manager metadata, journal and accepted-tip binding. Large
// capture/validation/charging belongs off-main or in authenticated immutable
// owner preparation; these synchronous pure functions do not establish that
// UI integration boundary or enable drawing publication/persistence.
const metadataEntries = new WeakSet(); // immutable capture memo, not a journal
const ownedMetadataEntries = new WeakSet(); // private alias-excluded headers only
const metadataFail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
function metadataFields(value,keys){
  if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value)))metadataFail('Expected plain own metadata fields.');
  const actual=Reflect.ownKeys(value);
  if(actual.length!==keys.length||actual.some(k=>typeof k!=='string'||!keys.includes(k)))metadataFail('Unexpected or missing metadata fields.');
  const result={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))metadataFail('Metadata fields must be enumerable own data.');result[key]=d.value;}return result;
}
function metadataBudget(){
  const encoder=new TextEncoder();let units=0,bytes=0;
  return{add(token){units+=token.length;bytes+=encoder.encode(token).byteLength;if(Math.max(2*units,bytes)>MAX_JOURNAL_BYTES)metadataFail('Metadata edit exceeds the shared journal limit.','RESOURCE_LIMIT');},get charge(){return Math.max(2*units,bytes);}};
}
function metadataFreeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))metadataFreeze(child);Object.freeze(value);}return value;}
// Fixed existing metadata-v1 schema has at most six nesting levels, seven
// fields per record, 10000 items per array, and 256-unit scalar strings. Copy
// descriptors before using the existing semantic validator, never getters or
// caller toJSON. Charge JSON tokens incrementally, including escaping/UTF-8.
function manufacturingCopy(value,budget,depth=0,path=new WeakSet()){
  if(depth>6)metadataFail('Manufacturing metadata nesting is unsupported.');
  if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)){
    budget.add(JSON.stringify(value));return value;
  }
  if(typeof value==='string'){
    if(value.length>256)metadataFail('Manufacturing text exceeds its existing bound.');
    budget.add(JSON.stringify(value));return value;
  }
  if(!value||typeof value!=='object'||path.has(value))metadataFail('Manufacturing metadata must be acyclic JSON data.');
  const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
  if(![null,array?Array.prototype:Object.prototype].includes(proto))metadataFail('Manufacturing metadata must use plain data prototypes.');
  path.add(value);
  try{
    if(array){
      const n=Object.getOwnPropertyDescriptor(value,'length')?.value;
      if(!integer(n,0,10000))metadataFail('Manufacturing arrays exceed their existing bound.');
      const keys=Reflect.ownKeys(value);if(keys.length!==n+1)metadataFail('Manufacturing arrays must be dense without extra properties.');
      const out=[];budget.add('[');
      for(let i=0;i<n;i++){if(i)budget.add(',');const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))metadataFail('Manufacturing arrays must contain own data.');out.push(manufacturingCopy(d.value,budget,depth+1,path));}
      budget.add(']');return out;
    }
    const keys=Reflect.ownKeys(value);
    if(keys.length>7||keys.some(k=>typeof k!=='string'||k.length>256))metadataFail('Manufacturing records have unsupported fields.');
    keys.sort();const out=Object.create(null);budget.add('{');
    for(let i=0;i<keys.length;i++){
      const key=keys[i],d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))metadataFail('Manufacturing records must contain own data.');
      if(i)budget.add(',');budget.add(JSON.stringify(key));budget.add(':');out[key]=manufacturingCopy(d.value,budget,depth+1,path);
    }
    budget.add('}');return out;
  }finally{path.delete(value);}
}
function captureManufacturingForJournal(value,budget){
  const captured=manufacturingCopy(value,budget);
  if(captured!==null){
    try{validateManufacturingMetadata(captured);}catch(cause){throw Object.assign(Error('Invalid manufacturing metadata.'),{code:'INVALID_REQUEST',cause});}
  }
  // Keep exact captured values (including represented -0); the legacy
  // validator's JSON clone is validation-only, not an implicit normalization.
  return metadataFreeze(captured);
}
function metadataEqual(a,b){
  if(Object.is(a,b))return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
  return ak.length===bk.length&&ak.every((key,i)=>key===bk[i]&&metadataEqual(a[key],b[key]));
}
function metadataMeasure(value,budget){
  if(value===null||typeof value!=='object'){budget.add(JSON.stringify(value));return;}
  const array=Array.isArray(value),keys=Object.keys(value);budget.add(array?'[':'{');
  for(let i=0;i<keys.length;i++){if(i)budget.add(',');const key=keys[i];if(!array){budget.add(JSON.stringify(key));budget.add(':');}metadataMeasure(value[key],budget);}
  budget.add(array?']':'}');
}
function metadataEntry(domain,key,before,after){
  if(!['manufacturing','linked-part-drawing'].includes(domain))metadataFail('Unsupported document metadata domain.');
  let a,b;
  if(domain==='manufacturing'){
    if(key!=='manufacturing')metadataFail('Manufacturing journal key must be explicit.');
    const budget=metadataBudget();a=captureManufacturingForJournal(before,budget);b=captureManufacturingForJournal(after,budget);
  }else{
    if(typeof key!=='string'||!key||key.length>128||/[\u0000-\u001f\u007f]/u.test(key))metadataFail('Invalid drawing journal identity.');
    a=before===null?null:captureLinkedPartDrawingDefinition(before);b=after===null?null:captureLinkedPartDrawingDefinition(after);
  }
  if(a===null&&b===null||metadataEqual(a,b))metadataFail('Document metadata journal entries must be actual changes.');
  const base={kind:'document-metadata',version:1,domain,key,before:a,after:b},budget=metadataBudget();metadataMeasure(base,budget);
  const result=domain==='linked-part-drawing'?captureLinkedPartDrawingOperationRecord({...base,byteSize:budget.charge}):metadataFreeze({...base,byteSize:budget.charge});
  metadataEntries.add(result);return result;
}
export function captureDocumentMetadataRecord(value){
  if(value&&typeof value==='object'&&metadataEntries.has(value))return value;
  const r=metadataFields(value,['kind','version','domain','key','before','after','byteSize']);
  if(r.kind!=='document-metadata'||r.version!==1)metadataFail('Unsupported document metadata journal record.');
  const entry=metadataEntry(r.domain,r.key,r.before,r.after);
  if(r.byteSize!==entry.byteSize)metadataFail('Document metadata journal charge is incorrect.');
  return entry;
}
export function documentMetadataTarget(entry){
  const r=entry&&typeof entry==='object'&&ownedMetadataEntries.has(entry)?entry:captureDocumentMetadataRecord(entry);
  return Object.freeze({kind:r.kind,domain:r.domain,key:r.key});
}
export function recordDocumentMetadataEdit(state,input){
  const r=metadataFields(input,['document','revision','domain','key','before','after']);
  checkCurrent(state,r.document,r.revision);
  const entry=metadataEntry(r.domain,r.key,r.before,r.after),entries=bounded([...state.entries.slice(0,state.cursor),entry]);
  return make(r.document,r.revision+1,entries,entries.length);
}
export function planDocumentMetadataTravel(state,input){
  const r=metadataFields(input,['document','revision','direction','domain','key','current']);checkCurrent(state,r.document,r.revision);
  if(!['undo','redo'].includes(r.direction))metadataFail('Invalid metadata history direction.');
  const undo=r.direction==='undo',raw=state.entries[undo?state.cursor-1:state.cursor];
  if(!raw||raw.kind!=='document-metadata')metadataFail('No document metadata edit in that direction.');
  const entry=captureDocumentMetadataRecord(raw);
  if(entry.domain!==r.domain||entry.key!==r.key)metadataFail('Document metadata history domain or key changed.');
  const current=entry.domain==='manufacturing'?captureManufacturingForJournal(r.current,metadataBudget()):r.current===null?null:captureLinkedPartDrawingDefinition(r.current);
  const expected=undo?entry.after:entry.before;
  if(!metadataEqual(current,expected))metadataFail('Current document metadata no longer matches the journal.');
  return Object.freeze({domain:entry.domain,key:entry.key,before:expected,after:undo?entry.before:entry.after,
    next:make(r.document,r.revision+1,state.entries,state.cursor+(undo?-1:1))});
}

// Worker-side payload helpers reuse exactly this journal's capture/equality
// rules without constructing another journal or retaining another history.
export function prepareManufacturingJournalRecord(before,after){return metadataEntry('manufacturing','manufacturing',before,after);}
export function captureManufacturingJournalPayload(value){return captureManufacturingForJournal(value,metadataBudget());}
export function equalManufacturingJournalPayloads(before,after){
  return metadataEqual(captureManufacturingForJournal(before,metadataBudget()),captureManufacturingForJournal(after,metadataBudget()));
}
export function verifyDocumentMetadataJournalTravel(entry,direction,current){
  if(!['undo','redo'].includes(direction))metadataFail('Invalid metadata history direction.');
  const captured=captureDocumentMetadataRecord(entry);
  const value=captured.domain==='manufacturing'?captureManufacturingForJournal(current,metadataBudget()):current===null?null:captureLinkedPartDrawingDefinition(current);
  const before=direction==='undo'?captured.after:captured.before;
  if(!metadataEqual(value,before))metadataFail('Current metadata payload no longer matches the journal.');
  return captured;
}
export function verifyManufacturingJournalTravel(entry,direction,current){
  const captured=captureDocumentMetadataRecord(entry);
  if(captured.domain!=='manufacturing'||captured.key!=='manufacturing')metadataFail('Expected manufacturing history.');
  return verifyDocumentMetadataJournalTravel(captured,direction,current);
}
// Main-side authenticated seam. Bulk validation/equality/charge happens in
// the preparation Worker. Drawing payloads are additionally bounded-captured
// after clone so the public definition getter returns genuinely frozen data.
function preparedDomain(p){
  if(p.domain==='manufacturing'&&p.key==='manufacturing')return;
  if(p.domain==='linked-part-drawing'&&typeof p.key==='string'&&p.key.length>0&&p.key.length<=128)return;
  metadataFail('Invalid prepared metadata domain.');
}
export function recordPreparedDocumentMetadataEdit(state,input){
  const r=metadataFields(input,['document','revision','preparation']);checkCurrent(state,r.document,r.revision);
  const p=readManufacturingWorkerPreparation(r.preparation);preparedDomain(p);
  if(!(p.domain==='manufacturing'?['enclosure','generic','rebind']:['drawing']).includes(p.action)||!p.changed||!p.entry||p.entry.kind!=='document-metadata'||p.entry.version!==1||p.entry.domain!==p.domain||p.entry.key!==p.key||!integer(p.entry.byteSize,1,MAX_JOURNAL_BYTES))metadataFail('Invalid prepared metadata edit.');
  ownedMetadataEntries.add(p.entry);
  const entries=bounded([...state.entries.slice(0,state.cursor),p.entry]);return make(r.document,r.revision+1,entries,entries.length);
}
export function planPreparedDocumentMetadataTravel(state,input){
  const r=metadataFields(input,['document','revision','direction','current','preparation']);checkCurrent(state,r.document,r.revision);
  const p=readManufacturingWorkerPreparation(r.preparation);preparedDomain(p);
  const undo=r.direction==='undo',entry=state.entries[undo?state.cursor-1:state.cursor];
  if(!['undo','redo'].includes(r.direction)||p.action!==(p.domain==='manufacturing'?'travel':'drawing-travel')||p.direction!==r.direction||p.entry!==entry||p.before!==r.current||entry?.kind!=='document-metadata'||entry.domain!==p.domain||entry.key!==p.key)metadataFail('Prepared metadata travel no longer matches the journal.');
  return Object.freeze({domain:p.domain,key:p.key,before:p.before,after:p.after,next:make(r.document,r.revision+1,state.entries,state.cursor+(undo?-1:1))});
}
export function recordPreparedManufacturingEdit(state,input){
  const r=metadataFields(input,['document','revision','preparation']),p=readManufacturingWorkerPreparation(r.preparation);if(p.domain!=='manufacturing')metadataFail('Expected manufacturing preparation.');
  return recordPreparedDocumentMetadataEdit(state,r);
}
export function planPreparedManufacturingTravel(state,input){
  const r=metadataFields(input,['document','revision','direction','current','preparation']),p=readManufacturingWorkerPreparation(r.preparation);if(p.domain!=='manufacturing')metadataFail('Expected manufacturing preparation.');
  return planPreparedDocumentMetadataTravel(state,r);
}


// Modern E19: retain exactly one removed extrusion, not a history/model copy.
export function captureOperationRemove(value) {
 const operation=appendData(value,['type','params']);
 if(operation.type!=='WORKER_SELECTED_PROFILE_EXTRUDE_V2')throw Error('Only selected-profile extrusion deletion is supported.');
 return Object.freeze({type:operation.type,params:captureSelectedProfileDepthParameters(operation.params)});
}
function primitiveRecordCharge(value){
 let bytes=256;const encoder=new TextEncoder();
 for(const key of Object.keys(value)){bytes+=32+key.length*12;const v=value[key];if(typeof v==='string'){for(let at=0;at<v.length;at+=1024){const part=v.slice(at,at+1024);bytes+=Math.max(part.length*12,encoder.encode(part).byteLength*6);}}else bytes+=64;}
 return bytes;
}
function removalIdentity(index,featureId,previousFeatureId,nextFeatureId,currentLength){
 checkIdentity(index,featureId);
 if(!integer(currentLength,1,256)||index>=currentLength||(index===0?previousFeatureId!==null:!integer(previousFeatureId,1,Number.MAX_SAFE_INTEGER))||(index===currentLength-1?nextFeatureId!==null:!integer(nextFeatureId,1,Number.MAX_SAFE_INTEGER))||featureId===previousFeatureId||featureId===nextFeatureId||previousFeatureId!==null&&previousFeatureId===nextFeatureId)throw Error('Invalid deletion adjacency.');
}
export function recordOperationRemove(state,input) {
 const {document,revision,index,operation,previousFeatureId,nextFeatureId,currentLength}=appendData(input,['document','revision','index','operation','previousFeatureId','nextFeatureId','currentLength']);
 checkCurrent(state,document,revision);const captured=captureOperationRemove(operation),featureId=captured.params.featureId;
 removalIdentity(index,featureId,previousFeatureId,nextFeatureId,currentLength);
 const entry=Object.freeze({kind:'operation-remove',index,featureId,previousFeatureId,nextFeatureId,currentLength,operation:captured,byteSize:512+primitiveRecordCharge(captured.params)});
 const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planOperationRemoveTravel(state,input){
 const {document,revision,direction,index,featureId,currentLength,currentOperation,previousFeatureId,nextFeatureId}=appendData(input,['document','revision','direction','index','featureId','currentLength','currentOperation','previousFeatureId','nextFeatureId']);
 checkCurrent(state,document,revision);checkIdentity(index,featureId);if(!['undo','redo'].includes(direction))throw Error('Invalid deletion travel direction.');
 const undo=direction==='undo',entry=state.entries[undo?state.cursor-1:state.cursor];
 if(!entry||entry.kind!=='operation-remove'||entry.index!==index||entry.featureId!==featureId||currentLength!==entry.currentLength-(undo?1:0)||previousFeatureId!==entry.previousFeatureId||nextFeatureId!==entry.nextFeatureId)throw Error('Deletion history length or adjacent identities changed.');
 if(undo){if(currentOperation!==null)throw Error('Undo deletion requires the removed operation to remain absent.');}
 else{const current=captureOperationRemove(currentOperation);if(current.type!==entry.operation.type||selectedProfileKeys.some(k=>!Object.is(current.params[k],entry.operation.params[k])))throw Error('The restored operation differs from the original deletion.');}
 return Object.freeze({index,featureId,operation:entry.operation,next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}
const throughHoleParentKeys=Object.freeze(['target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId']);
const throughHoleParentIdentityKeys=Object.freeze(['version','unit','engine','engineRevision','featureId','kind','diameter']);
export function captureThroughHoleParentBinding(value){
 const r=appendData(value,throughHoleParentKeys);
 if(!integer(r.producerFeatureId,1,Number.MAX_SAFE_INTEGER)||!integer(r.sourceFeatureId,1,Number.MAX_SAFE_INTEGER)||r.target!==solidBodyId(r.producerFeatureId)||typeof r.sourceFaceId!=='string'||!r.sourceFaceId||r.sourceFaceId.length>256||typeof r.sourceRegionId!=='string'||!r.sourceRegionId||r.sourceRegionId.length>8192)throw Error('Invalid authored through-hole parent binding.');
 return Object.freeze(r);
}
export function recordThroughHoleParentRepair(state,input){
 const {document,revision,index,featureId,parameters,after}=appendData(input,['document','revision','index','featureId','parameters','after']);checkCurrent(state,document,revision);checkIdentity(index,featureId);
 const current=captureAuthoredHoleIntent(parameters),next=captureThroughHoleParentBinding(after);
 if(current.featureId!==featureId||current.kind!=='centered-through')throw Error('Only the same authored centered-through feature can be repaired.');
 const before=captureThroughHoleParentBinding(Object.fromEntries(throughHoleParentKeys.map(k=>[k,current[k]])));
 if(throughHoleParentKeys.every(k=>Object.is(before[k],next[k])))throw Error('An unchanged parent is not a repair.');
 captureAuthoredHoleIntent({...current,...next});
 const identity=Object.freeze(Object.fromEntries(throughHoleParentIdentityKeys.map(k=>[k,current[k]]))),entry=Object.freeze({kind:'through-hole-parent',index,featureId,identity,before,after:next,byteSize:512+primitiveRecordCharge(identity)+primitiveRecordCharge(before)+primitiveRecordCharge(next)});
 const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(document,revision+1,entries,entries.length);
}
export function planThroughHoleParentRepairTravel(state,input){
 const {document,revision,direction,index,featureId,parameters}=appendData(input,['document','revision','direction','index','featureId','parameters']);checkCurrent(state,document,revision);checkIdentity(index,featureId);if(!['undo','redo'].includes(direction))throw Error('Invalid parent repair travel direction.');
 const undo=direction==='undo',entry=state.entries[undo?state.cursor-1:state.cursor],current=captureAuthoredHoleIntent(parameters);
 if(!entry||entry.kind!=='through-hole-parent'||entry.index!==index||entry.featureId!==featureId||current.kind!=='centered-through'||throughHoleParentIdentityKeys.some(k=>!Object.is(current[k],entry.identity[k]))||throughHoleParentKeys.some(k=>!Object.is(current[k],entry[undo?'after':'before'][k])))throw Error('The current hole no longer matches this parent repair.');
 const restored=captureAuthoredHoleIntent({...entry.identity,...entry[undo?'before':'after']});
 return Object.freeze({index,featureId,parameters:restored,next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}

// Same journal, source deltas only. Signatures bind the bounded exact authored
// definition, not geometry; suffix payloads are charged and never snapshots.
export const HISTORY_CONTROL_KINDS=Object.freeze(['feature-suppression','history-position','history-branch']);
function historySignatureBytes(text){
 const encoder=new TextEncoder();let bytes=0;
 for(let start=0;start<text.length;){let end=Math.min(start+1024,text.length);if(end<text.length&&text.charCodeAt(end-1)>=0xd800&&text.charCodeAt(end-1)<=0xdbff&&text.charCodeAt(end)>=0xdc00&&text.charCodeAt(end)<=0xdfff)end--;bytes+=encoder.encode(text.slice(start,end)).byteLength;start=end;}
 return Math.max(2*text.length,bytes);
}
export function recordHistoryControl(state,input){
 const common=['document','revision','kind','beforeSignature','afterSignature','beforePointer','afterPointer'];
 const kind=Object.getOwnPropertyDescriptor(input||{},'kind')?.value;
 const extra=kind==='feature-suppression'?['index','featureId','operationType','beforeSuppressed','afterSuppressed']:kind==='history-branch'?['suffix']:[];
 const a=appendData(input,[...common,...extra]);checkCurrent(state,a.document,a.revision);
 if(!HISTORY_CONTROL_KINDS.includes(kind)||!integer(a.beforePointer,-1,255)||!integer(a.afterPointer,-1,255)||[a.beforeSignature,a.afterSignature].some(v=>typeof v!=='string'||!v||v.length>262144))throw Error('Invalid bounded history-control record.');
 let byteSize=512+historySignatureBytes(a.beforeSignature)+historySignatureBytes(a.afterSignature),delta={};
 if(kind==='feature-suppression'){
  checkIdentity(a.index,a.featureId);
  if(typeof a.operationType!=='string'||a.operationType.length>128||typeof a.beforeSuppressed!=='boolean'||typeof a.afterSuppressed!=='boolean'||a.beforeSuppressed===a.afterSuppressed)throw Error('Invalid suppression delta.');
  delta={index:a.index,featureId:a.featureId,operationType:a.operationType,beforeSuppressed:a.beforeSuppressed,afterSuppressed:a.afterSuppressed};
 }else if(kind==='history-branch'){
  if(!Array.isArray(a.suffix)||!a.suffix.length||a.suffix.length>256||Reflect.ownKeys(a.suffix).length!==a.suffix.length+1)throw Error('Invalid authored branch suffix.');
  const suffix=[];for(let i=0;i<a.suffix.length;i++){const d=Object.getOwnPropertyDescriptor(a.suffix,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Branch suffix must be dense own data.');const operation=captureOperationAppend(d.value);byteSize+=operationAppendBytes(operation);suffix.push(operation);}
  delta={suffix:Object.freeze(suffix)};
 }else if(a.beforeSignature!==a.afterSignature||a.beforePointer===a.afterPointer)throw Error('Invalid history position delta.');
 const entry=Object.freeze({kind,beforeSignature:a.beforeSignature,afterSignature:a.afterSignature,beforePointer:a.beforePointer,afterPointer:a.afterPointer,...delta,byteSize});
 const entries=bounded([...state.entries.slice(0,state.cursor),entry]);return make(a.document,a.revision+1,entries,entries.length);
}
export function planHistoryControlTravel(state,{document,revision,direction,currentSignature,currentPointer}){
 checkCurrent(state,document,revision);if(!['undo','redo'].includes(direction))throw Error('Invalid history-control direction.');
 const entry=state.entries[direction==='undo'?state.cursor-1:state.cursor],undo=direction==='undo';
 if(!entry||!HISTORY_CONTROL_KINDS.includes(entry.kind)||currentSignature!==entry[undo?'afterSignature':'beforeSignature']||currentPointer!==entry[undo?'afterPointer':'beforePointer'])throw Error('The authored history control is stale.');
 return Object.freeze({entry,pointer:entry[undo?'beforePointer':'afterPointer'],signature:entry[undo?'beforeSignature':'afterSignature'],next:make(document,revision+1,state.entries,state.cursor+(undo?-1:1))});
}
