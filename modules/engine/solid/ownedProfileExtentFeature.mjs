// One authored family. Bounds and a placed Native face are evaluation data,
// never duplicate saved coordinates, source planes, flags or kernel indices.
export const PROFILE_EXTENT_TYPE='WORKER_SELECTED_PROFILE_EXTENT_EXTRUDE_V1';
export const PROFILE_EXTENT_FIELDS=Object.freeze({
 'one-sided':Object.freeze(['distance']),
 symmetric:Object.freeze(['length']),
 'two-sided':Object.freeze(['positive','negative'])
});
const common=['version','unit','engine','engineRevision','featureId','faceId','regionId','bodyPolicy'];
const name=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
const fail=(message,code='INVALID_REQUEST')=>{throw Object.assign(Error(message),{code});};
function record(value,keys){
 if(!value||typeof value!=='object'||Array.isArray(value)||![null,Object.prototype].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)fail('Expected exact profile-extent own data.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('Profile-extent fields must be own data.');out[key]=d.value;}return out;
}
export function profileExtentFields(value){
 const d=value&&typeof value==='object'?Object.getOwnPropertyDescriptor(value,'extent'):null;
 if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string'||!Object.hasOwn(PROFILE_EXTENT_FIELDS,d.value))fail('Choose an explicit profile extent variant.');
 return PROFILE_EXTENT_FIELDS[d.value];
}
export function profileExtentValueValid(mode,key,value,allowName=true){
 if(!Object.hasOwn(PROFILE_EXTENT_FIELDS,mode)||!PROFILE_EXTENT_FIELDS[mode].includes(key))return false;
 if(allowName&&typeof value==='string')return name.test(value);
 if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e6)return false;
 return mode==='one-sided'?value!==0:mode==='symmetric'?value>0:value>=0;
}
export function captureProfileExtent(input,{numeric=false}={}){
 const keys=profileExtentFields(input),r=record(input,['extent',...keys]);
 for(const key of keys)if(!profileExtentValueValid(r.extent,key,r[key],!numeric))fail('The active profile extent is outside its signed/positive/nonnegative millimeter domain.');
 if(r.extent==='two-sided'&&typeof r.positive==='number'&&typeof r.negative==='number'&&(!(r.positive+r.negative>0)||r.positive+r.negative>1e6))fail('Two-sided extents require a positive total span no greater than one million millimeters.');
 return Object.freeze(r);
}
// Derived physical manifests already contain only active numeric fields. The
// three disjoint exact field sets identify their authored variant without an
// extra saved flag, guessed value/sign, or a second extent representation.
export function profileExtentFromFields(input,options){
 if(!input||typeof input!=='object'||Array.isArray(input)||![null,Object.prototype].includes(Object.getPrototypeOf(input)))fail('Expected own active extent fields.');
 const keys=Reflect.ownKeys(input);if(keys.some(k=>typeof k!=='string'))fail('Expected literal extent field names.');
 const mode=Object.keys(PROFILE_EXTENT_FIELDS).find(mode=>PROFILE_EXTENT_FIELDS[mode].length===keys.length&&PROFILE_EXTENT_FIELDS[mode].every(key=>keys.includes(key)));
 if(!mode)fail('Expected exactly one active extent field set.');
 const captured=record(input,PROFILE_EXTENT_FIELDS[mode]);return captureProfileExtent({extent:mode,...captured},options);
}
export function profileExtentInterval(input){
 const e=captureProfileExtent(input,{numeric:true});
 const lower=e.extent==='one-sided'?Math.min(0,e.distance):e.extent==='symmetric'?-e.length/2:-e.negative;
 const upper=e.extent==='one-sided'?Math.max(0,e.distance):e.extent==='symmetric'?e.length/2:e.positive;
 const span=upper-lower;
 if(!Number.isFinite(span)||!(upper>lower)||!(span>0)||span>1e6)fail('The resolved profile extent cannot be represented as a supported positive span.','PROFILE_EXTENT_UNREPRESENTABLE');
 return Object.freeze({lower,upper,span});
}
export function captureOwnedProfileExtentFeature(input){
 const keys=profileExtentFields(input),r=record(input,[...common,'extent',...keys]);
 if(r.version!==1||r.unit!=='millimeter'||r.engine!=='occ'||typeof r.engineRevision!=='string'||!/^sha256:[a-f0-9]{64}:[a-f0-9]{64}$/.test(r.engineRevision)||!Number.isSafeInteger(r.featureId)||r.featureId<1||r.bodyPolicy!=='separate')fail('An explicit separate OCC millimeter profile-extent feature is required.');
 if(typeof r.faceId!=='string'||!r.faceId||r.faceId.length>256||typeof r.regionId!=='string'||!r.regionId.startsWith('sketch-region:')||r.regionId.length>8192)fail('Select the actual bounded source face and opaque region.');
 const extent=captureProfileExtent(Object.fromEntries(['extent',...keys].map(key=>[key,r[key]])));
 return Object.freeze({...Object.fromEntries(common.map(key=>[key,r[key]])),...extent});
}
export function profileExtentDimensions(input){
 const feature=captureOwnedProfileExtentFeature(input);
 return captureProfileExtent(Object.fromEntries(['extent',...profileExtentFields(feature)].map(key=>[key,feature[key]])));
}
export function materializeOwnedProfileExtentFeature(input,expressions,materialized){
 const authored=captureOwnedProfileExtentFeature(input),resolved={...authored};
 for(const key of profileExtentFields(authored)){
  let value=authored[key];
  if(typeof value==='string'){
   if(expressions?.isTyped!==true||!expressions.hasCurrentPhysicalResult())fail('A current authoritative typed length source is required.','UNSUPPORTED_PARAMETERS');
   value=expressions.resolveQuantity(value,'length');
  }
  if(!profileExtentValueValid(authored.extent,key,value,false))fail('The resolved profile extent is outside its active millimeter domain.');
  if(materialized&&!Object.is(materialized[key],value))fail('Materialized extent differs from its captured current typed source.');
  resolved[key]=value;
 }
 profileExtentInterval(profileExtentDimensions(resolved));
 return Object.freeze({authored,resolved:captureOwnedProfileExtentFeature(resolved)});
}
