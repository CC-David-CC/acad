// One producer identity domain across all authored operation kinds. Numeric
// strings stay serialized as authored, but share identity with equal numbers.
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function ownData(value,key){
 const field=value&&typeof value==='object'&&!Array.isArray(value)?Object.getOwnPropertyDescriptor(value,key):null;
 if(!field?.enumerable||!Object.hasOwn(field,'value'))fail('INVALID_FEATURE_ID','Authored operations require an own saved feature ID.');
 return field.value;
}
export function canonicalAuthoredFeatureId(value){
 const id=typeof value==='number'?value:typeof value==='string'&&/^[1-9][0-9]{0,15}$/.test(value)&&String(Number(value))===value?Number(value):NaN;
 if(!Number.isSafeInteger(id)||id<=0)fail('INVALID_FEATURE_ID','Authored feature IDs must be positive safe integers or their canonical decimal strings.');
 return id;
}
export function claimAuthoredFeatureIdentity(operation,seen){
 const id=canonicalAuthoredFeatureId(ownData(ownData(operation,'params'),'featureId'));
 if(seen.has(id))fail('DUPLICATE_FEATURE_ID','Authored feature IDs must be globally unique; duplicate producer '+id+'.');
 seen.add(id);return id;
}
