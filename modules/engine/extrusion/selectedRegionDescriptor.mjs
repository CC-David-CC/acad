// Small metadata contract only. No geometry, topology extraction or CAD handles.
import {isArrangementDescriptor,captureArrangementDescriptor,arrangementRegionIdentity,captureArrangementAnalysis,arrangementPolicy,contactArrangementPolicy} from './selectedArrangementDescriptor.mjs';
const MAX_SOURCE_OBJECTS=4096,MAX_CURVES=4096,MAX_LOOPS=128,MAX_ID=256,MAX_RESPONSE=65536;
const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_RESPONSE'});};
function data(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length)fail('Invalid selected-region metadata fields.');
 const copy={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Selected-region metadata must be data.');copy[key]=d.value;}return copy;
}
function array(value,max){
 if(!Array.isArray(value)||value.length>max||Reflect.ownKeys(value).length!==value.length+1)fail('Selected-region metadata arrays must be bounded and dense.');
 const out=[];for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Selected-region metadata arrays must contain data.');out.push(d.value);}return out;
}
function own(value,key){const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,key):null;if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Invalid solved source metadata.');return d.value;}
export function captureSelectedRegionCurveIds(sketch){
 const objects=array(own(sketch,'objects'),MAX_SOURCE_OBJECTS),seen=new Set(),ids=[];
 for(const object of objects){const id=own(object,'id'),type=own(object,'type'),role=own(object,'role'),stage=own(object,'stage');if(typeof id!=='string'||!id||id.length>MAX_ID||seen.has(id))fail('Invalid solved source curve identity.');seen.add(id);if(stage===0&&role===null&&['Segment','Circle'].includes(type))ids.push(id);}
 return Object.freeze(ids);
}
// Producer and consumers share this source namespace. The local native ID
// stays opaque; never split it or infer endpoint identities from its spelling.
export function qualifySourceCurveId(faceId,curveId){
 if(typeof faceId!=='string'||!faceId||faceId.length>MAX_ID||typeof curveId!=='string'||!curveId||curveId.length>MAX_ID)fail('Expected bounded source and local curve identities.');
 return faceId+'/'+curveId;
}
export function describeSelectedRegion(region,qualifiedToLocal){
 const local=id=>{if(!qualifiedToLocal.has(id))fail('Region boundary is not bound to its captured source.');return qualifiedToLocal.get(id);};
 return Object.freeze({outerCurveIds:Object.freeze(region.outer.map(local)),holeCurveIds:Object.freeze(region.holes.map(loop=>Object.freeze(loop.map(local))))});
}
function descriptor(value,faceId,sourceIds,charge){
 if(isArrangementDescriptor(value))return captureArrangementDescriptor(value,sourceIds);
 const d=data(value,['outerCurveIds','holeCurveIds']),seen=new Set();let total=0;
 const loop=value=>{const ids=array(value,512);if(!ids.length||(total+=ids.length)>MAX_CURVES)fail('Region boundary curve count exceeds its limit.');for(let i=0;i<ids.length;i++){const id=ids[i];if(typeof id!=='string'||!id||id.length>MAX_ID||qualifySourceCurveId(faceId,id).length>MAX_ID||!sourceIds.has(id)||seen.has(id)||i&&ids[i-1]>=id)fail('Region curve IDs must be unique canonical ordinary source curves.');seen.add(id);charge(id);}return Object.freeze(ids);};
 const outerCurveIds=loop(d.outerCurveIds),rawHoles=array(d.holeCurveIds,MAX_LOOPS-1),holeCurveIds=rawHoles.map(loop);let previous=null;
 for(const ids of holeCurveIds){const key=JSON.stringify(ids.map(id=>qualifySourceCurveId(faceId,id)));if(previous!==null&&previous>=key)fail('Region holes must have canonical source ordering.');previous=key;}
 return Object.freeze({outerCurveIds,holeCurveIds:Object.freeze(holeCurveIds)});
}
function regionIdentity(faceId,d){return isArrangementDescriptor(d)?arrangementRegionIdentity(faceId,d):'sketch-region:'+JSON.stringify({faceId,outer:d.outerCurveIds.map(id=>qualifySourceCurveId(faceId,id)),holes:d.holeCurveIds.map(ids=>ids.map(id=>qualifySourceCurveId(faceId,id)))});}
// Metadata admission only. The Worker owns exact graph/self-contact and
// conservative geometry proof; this census prevents omitted/invented IDs.
function captureSourceAnalysis(value,sourceIds,regions,charge){
 if([arrangementPolicy,contactArrangementPolicy].includes(Object.getOwnPropertyDescriptor(value||{},'policy')?.value))return captureArrangementAnalysis(value,sourceIds,regions,charge);
 const r=data(value,['version','policy','clearanceMm','closedComponents','openComponents']);
 if(r.version!==1||r.policy!=='v3-extrusion-isolated-open-chains'||r.clearanceMm!==0.0001)fail('Unknown selected-source component policy.');
 const seen=new Set(),closed=new Map();
 function components(value,open){
  let previous=null;
  return Object.freeze(array(value,open?512:128).map(raw=>{
   const row=data(raw,open?['kind','curveIds','reason','separation']:['kind','curveIds']),ids=array(row.curveIds,512);
   if(open?row.kind!=='open-chain'||row.reason!=='OPEN_NON_BOUNDARY'||row.separation!=='outward-aabb-clearance':!['circle','polygon'].includes(row.kind))fail('Invalid selected-source component classification.');
   if(!ids.length||!open&&(row.kind==='circle'?ids.length!==1:ids.length<3))fail('Invalid selected-source component size.');
   for(let i=0;i<ids.length;i++){
    const id=ids[i];if(typeof id!=='string'||!id||id.length>MAX_ID||!sourceIds.has(id)||seen.has(id)||i&&ids[i-1]>=id)fail('Selected-source components must canonically cover real ordinary curve IDs once.');
    seen.add(id);charge(id);
   }
   const key=JSON.stringify(ids);if(previous!==null&&previous>=key)fail('Selected-source components are not canonical.');previous=key;
   if(!open)closed.set(key,row.kind);row.curveIds=Object.freeze(ids);return Object.freeze(row);
  }));
 }
 r.closedComponents=components(r.closedComponents,false);r.openComponents=components(r.openComponents,true);
 if(seen.size!==sourceIds.size)fail('Selected-source component census omitted ordinary curves.');
 const outers=new Set();
 for(const region of regions){
  const key=JSON.stringify(region.descriptor.outerCurveIds);if(!closed.has(key)||outers.has(key))fail('Region outer does not match one unique closed source component.');outers.add(key);
  for(const hole of region.descriptor.holeCurveIds)if(!closed.has(JSON.stringify(hole)))fail('Region hole is not a reported closed source component.');
 }
 if(outers.size!==closed.size)fail('Region discovery omitted a closed source component.');
 return Object.freeze(r);
}
export function captureSelectedRegionInspection(value,expected,sourceCurveIds,includeSourceAnalysis=false,circularCapture){
 if(circularCapture!==undefined&&(!circularCapture||circularCapture.version!==1||circularCapture.policy!=='v3-extrusion-two-circle-arrangement-v1'||['isDescriptor','captureDescriptor','regionIdentity','captureAnalysis'].some(k=>typeof circularCapture[k]!=='function')))fail('Invalid private circular source capture.');
 const result=data(value,includeSourceAnalysis?['binding','regions','sourceAnalysis']:['binding','regions']),binding=data(result.binding,['revision','sketchDigest','faceId']);
 if(Object.keys(binding).some(k=>binding[k]!==expected[k]))fail('Invalid selected-region discovery binding.');
 const sourceValues=array(sourceCurveIds,MAX_SOURCE_OBJECTS);if(sourceValues.some(id=>typeof id!=='string'||!id||id.length>MAX_ID))fail('Invalid captured source curve census.');const sourceIds=new Set(sourceValues);if(sourceIds.size!==sourceValues.length)fail('Invalid captured source curve census.');
 let text=0;const charge=s=>{text+=s.length;if(text>MAX_RESPONSE)fail('Region metadata exceeds its response budget.');},seen=new Set(),regions=[];
 const rows=array(result.regions,128);if(!rows.length)fail('Region discovery must not return an empty success.');
 for(const raw of rows){
  const row=data(raw,['regionId','support','reason','descriptor']);
  if(typeof row.regionId!=='string'||!row.regionId.startsWith('sketch-region:')||row.regionId.length>MAX_RESPONSE||seen.has(row.regionId)||!['supported','unsupported'].includes(row.support))fail('Invalid selected-region row.');seen.add(row.regionId);charge(row.regionId);
  if(row.support==='supported'){if(row.reason!==null||row.regionId.length>8192)fail('Invalid supported region.');}
  else{const reason=data(row.reason,['code','message']);if(typeof reason.code!=='string'||!/^[A-Z0-9_]{1,64}$/.test(reason.code)||typeof reason.message!=='string'||reason.message.length>512)fail('Invalid unsupported-region reason.');charge(reason.code);charge(reason.message);row.reason=Object.freeze(reason);}
  const circular=circularCapture?.isDescriptor(row.descriptor)===true;row.descriptor=circular?circularCapture.captureDescriptor(row.descriptor,sourceIds):descriptor(row.descriptor,binding.faceId,sourceIds,charge);
  if((circular?circularCapture.regionIdentity(binding.faceId,row.descriptor):regionIdentity(binding.faceId,row.descriptor))!==row.regionId)fail('Region descriptor does not belong to its opaque identity.');regions.push(Object.freeze(row));
 }
 const circularAnalysis=circularCapture&&Object.getOwnPropertyDescriptor(result.sourceAnalysis||{},'policy')?.value===circularCapture.policy;
 const sourceAnalysis=includeSourceAnalysis?(circularAnalysis?circularCapture.captureAnalysis(result.sourceAnalysis,sourceIds,regions,charge):captureSourceAnalysis(result.sourceAnalysis,sourceIds,regions,charge)):null;
 const captured=Object.freeze({binding:Object.freeze(binding),regions:Object.freeze(regions),...(sourceAnalysis?{sourceAnalysis}:{})});
 if(new TextEncoder().encode(JSON.stringify(captured)).byteLength>MAX_RESPONSE)fail('Region metadata exceeds its encoded response budget.');return captured;
}
