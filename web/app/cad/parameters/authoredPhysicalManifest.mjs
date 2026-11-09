import {physicalBindingFields,activePhysicalBindingFields} from './physicalBindingFields.mjs';
import {requireModernPhysicalHistory} from './modernPhysicalBindings.mjs';
import {prepareTypedRectangle} from './typedRectangleBindings.mjs';
import {assertNoUnsupportedPhysicalNames} from './physicalLiteralFields.mjs';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
// Namespace hints cover the union of two independently bounded 256-name sources.
// They do not enlarge the authored definition, Worker quantity, or target limits.
// Input history is already captured by captureAuthoredHistory; it is detached,
// cooperative and bounded. No live document or raw model state is read here.
export function deriveAuthoredPhysicalManifest(history,parameterNames,readSketch){
 if(!Array.isArray(history)||history.length>256||!Array.isArray(parameterNames)||parameterNames.length>512||typeof readSketch!=='function')throw Error('Invalid captured parameter inputs.');
 const names=new Set(parameterNames);if(names.size!==parameterNames.length||parameterNames.some(n=>typeof n!=='string'||!/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/.test(n)))throw Error('Invalid parameter names.');
 requireModernPhysicalHistory(history);
 const targets=[],faces=new Set(),features=new Set();

 for(let index=0;index<history.length;index++){
  const request=history[index];if(!request||typeof request!=='object'||typeof request.type!=='string'||!request.params||typeof request.params!=='object')throw Error('Invalid captured feature.');
  const list=own(physicalBindingFields,request.type)?activePhysicalBindingFields(request.type,request.params).filter(key=>request.type!=='WORKER_THROUGH_HOLES_V1'||request.params.kind!=='centered-through'||key==='diameter'):null;
  assertNoUnsupportedPhysicalNames(request.type,request.params,list||[],names);
  if(!list)continue;
  const featureId=Number(request.params.featureId);if(!Number.isSafeInteger(featureId)||featureId<1||features.has(featureId))throw Error('Duplicate or invalid feature identity.');features.add(featureId);
  const fields=Object.create(null);for(const key of list){if(!own(request.params,key))throw Error('A supported feature field is missing.');fields[key]=request.params[key];}
  targets.push(Object.freeze({kind:'feature',index,featureId,type:request.type,fields:Object.freeze(fields)}));
  if(['WORKER_SELECTED_PROFILE_EXTRUDE_V2','WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1'].includes(request.type)){
   const {faceId,regionId}=request.params;if(typeof faceId!=='string'||!faceId||faceId.length>256||typeof regionId!=='string'||!regionId.startsWith('sketch-region:')||regionId.length>8192||faces.has(faceId))throw Error('Invalid selected profile source.');faces.add(faceId);
   targets.push(Object.freeze({kind:'selected-profile',index,featureId,faceId,regionId}));
  }
  if(request.type==='WORKER_RECTANGLE_EXTRUDE_V1'){
   const faceId=request.params.face;if(typeof faceId!=='string'||!faceId||faceId.length>1024||faces.has(faceId))throw Error('Duplicate or invalid rectangle identity.');faces.add(faceId);
   const source=readSketch(faceId);if(typeof source!=='string')throw Error('The rectangle source is unavailable.');
   const sketch=prepareTypedRectangle(source,[],()=>1),width=sketch.bindings.find(x=>x.segmentId==='rect-0')?.value,height=sketch.bindings.find(x=>x.segmentId==='rect-1')?.value;
   targets.push(Object.freeze({kind:'rectangle',faceId,widthSegmentId:'rect-0',heightSegmentId:'rect-1',width,height}));
  }
 }
 if(targets.length>256)throw Error('Too many supported binding targets.');
 return Object.freeze({version:1,targets:Object.freeze(targets)});
}
