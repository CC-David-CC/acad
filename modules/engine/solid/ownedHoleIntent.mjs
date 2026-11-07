// Authored replay inputs only. Source ancestry, capability and through-all tool
// extent must be proved/derived by evaluation; this parser proves none of them.
import {solidBodyId} from './solidIntent.mjs';
const commonKeys=Object.freeze(['version','unit','engine','engineRevision','featureId','target','producerFeatureId','sourceFeatureId','sourceFaceId','sourceRegionId','kind','diameter']);
const cornerKeys=Object.freeze([...commonKeys,'offsetX','offsetY']);
const fail=message=>{throw Object.assign(new Error(message),{code:'INVALID_REQUEST'});};
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=1e6;
const identity=value=>Number.isSafeInteger(value)&&value>0;
const text=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max;

export function captureOwnedHoleIntent(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Expected authored hole data.');
 const keys=Reflect.ownKeys(input);
 if(![commonKeys.length,cornerKeys.length].includes(keys.length)||keys.some(key=>typeof key!=='string'||!cornerKeys.includes(key)))fail('Unexpected authored hole fields.');
 const captured=Object.create(null);
 for(const key of keys){
  const descriptor=Object.getOwnPropertyDescriptor(input,key);
  if(!descriptor?.enumerable||!Object.hasOwn(descriptor,'value'))fail('Authored hole fields must be own data.');
  captured[key]=descriptor.value;
 }
 const expected=captured.kind==='centered-through'?commonKeys:captured.kind==='four-corner-through'?cornerKeys:null;
 if(!expected||keys.length!==expected.length||expected.some(key=>!Object.hasOwn(captured,key)))fail('Unexpected authored hole kind or fields.');
 if(captured.version!==1||captured.unit!=='millimeter'||captured.engine!=='occ'||typeof captured.engineRevision!=='string'||captured.engineRevision.length!==136||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(captured.engineRevision))fail('Invalid authored hole version, units or engine revision.');
 if(![captured.featureId,captured.producerFeatureId,captured.sourceFeatureId].every(identity)||captured.featureId===captured.producerFeatureId||captured.featureId===captured.sourceFeatureId)fail('Invalid authored hole feature relationships.');
 if(!text(captured.target,1024)||captured.target!==solidBodyId(captured.producerFeatureId)||!text(captured.sourceFaceId,256)||!text(captured.sourceRegionId,8192))fail('Invalid authored hole source or target identity.');
 if(!positive(captured.diameter)||captured.kind==='four-corner-through'&&(!positive(captured.offsetX)||!positive(captured.offsetY)))fail('Invalid authored hole dimensions.');
 // Canonical field order; every accepted value is a primitive. Offset anchors
 // remain authored values even if later geometry places their rows in reverse.
 const result={};for(const key of expected)result[key]=captured[key];
 return Object.freeze(result);
}
