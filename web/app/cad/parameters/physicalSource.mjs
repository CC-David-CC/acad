import {QuantityError} from './physicalQuantities.mjs';
export const PHYSICAL_SOURCE_PREFIX='codi-physical-parameters:1\n';
export const PHYSICAL_CONFIGURATION_PREFIX='codi-physical-parameters:2\n';
const ROOT='codi-physical-parameters:';
export function decodePhysicalSource(source){
 if(typeof source!=='string'||source.length>131072)throw new QuantityError('INVALID_INPUT','Invalid parameter source.');
 if(!source.startsWith(ROOT))return null;
 if(source.startsWith(PHYSICAL_CONFIGURATION_PREFIX)){if(source.length>65536||new TextEncoder().encode(source).byteLength>65536)throw new QuantityError('LIMIT','Configuration source exceeds 64 KiB.');let parsed;try{parsed=JSON.parse(source.slice(PHYSICAL_CONFIGURATION_PREFIX.length))}catch{throw new QuantityError('INVALID_INPUT','Invalid configuration source JSON.')}return capturePhysicalConfigurations(parsed);}
 if(!source.startsWith(PHYSICAL_SOURCE_PREFIX))throw new QuantityError('UNSUPPORTED_VERSION','Unsupported parameter source version.');
 let definitions;try{definitions=JSON.parse(source.slice(PHYSICAL_SOURCE_PREFIX.length))}catch{throw new QuantityError('INVALID_INPUT','Invalid parameter source JSON.')}
 if(!Array.isArray(definitions)||definitions.length>256)throw new QuantityError('INVALID_INPUT','Invalid parameter definitions.');
 return {version:1,definitions};
}
export function encodePhysicalSource(definitions){
 if(!Array.isArray(definitions)||definitions.length>256||Reflect.ownKeys(definitions).length!==definitions.length+1)throw new QuantityError('INVALID_INPUT','Expected dense parameter definitions.');
 const snapshot=[];let budget=2;for(let i=0;i<definitions.length;i++){const slot=Object.getOwnPropertyDescriptor(definitions,String(i)),item=slot?.value;if(!slot?.enumerable||!Object.hasOwn(slot,'value')||!item||typeof item!=='object'||Array.isArray(item)||(Object.getPrototypeOf(item)!==null&&Object.getPrototypeOf(Object.getPrototypeOf(item))!==null)||Reflect.ownKeys(item).length!==3)throw new QuantityError('INVALID_INPUT','Expected parameter data fields.');const row={};for(const key of ['name','dimension','expression']){const d=Object.getOwnPropertyDescriptor(item,key);if(!d?.enumerable||!Object.hasOwn(d,'value')||typeof d.value!=='string')throw new QuantityError('INVALID_INPUT','Expected parameter data fields.');const limit=key==='name'?128:key==='dimension'?16:2048;if(d.value.length>limit)throw new QuantityError('LIMIT','Parameter field exceeds limits.');budget+=6*d.value.length+32;if(budget>131072-PHYSICAL_SOURCE_PREFIX.length)throw new QuantityError('LIMIT','Parameter source exceeds limits.');row[key]=d.value;}snapshot.push(row);}
 const text=JSON.stringify(snapshot);if(text.length>131072-PHYSICAL_SOURCE_PREFIX.length)throw new QuantityError('LIMIT','Parameter source exceeds limits.');return PHYSICAL_SOURCE_PREFIX+text;
}

// V2 stores one base definition set plus sparse named overrides; no evaluated
// geometry, duplicate design or per-configuration parameter table is saved.
export function capturePhysicalConfigurations(input){
 const fail=(code,message)=>{throw new QuantityError(code,message)};
 const data=(object,keys)=>{const proto=object&&typeof object==='object'?Object.getPrototypeOf(object):undefined;if(!object||typeof object!=='object'||Array.isArray(object)||(proto!==null&&Object.getPrototypeOf(proto)!==null)||Reflect.ownKeys(object).length!==keys.length||Reflect.ownKeys(object).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_INPUT','Invalid configuration fields.');const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(object,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_INPUT','Configuration fields must be data.');out[key]=d.value;}return out;};
 const dense=(items,max)=>{if(!Array.isArray(items)||items.length>max||Reflect.ownKeys(items).length!==items.length+1)fail('LIMIT','Invalid configuration list.');return Array.from({length:items.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(items,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))fail('INVALID_INPUT','Configuration lists must be dense.');return d.value;});};
 const root=data(input,['version','definitions','configurations','activeId']);if(root.version!==2)fail('UNSUPPORTED_VERSION','Unsupported configuration version.');
 // Reuse the v1 pre-stringify descriptor/field limits for base definitions.
 const base=JSON.parse(encodePhysicalSource(root.definitions).slice(PHYSICAL_SOURCE_PREFIX.length)),known=new Set(base.map(d=>d.name));if(known.size!==base.length)fail('INVALID_NAME','Duplicate parameter name.');
 const encoder=new TextEncoder();let budget=encoder.encode(JSON.stringify(base)).byteLength+128;const ids=new Set(),names=new Set(),configs=[];
 for(const item of dense(root.configurations,32)){const c=data(item,['id','name','overrides']);if(typeof c.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(c.id)||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>128||names.has(c.name))fail('INVALID_NAME','Invalid or duplicate configuration identity.');ids.add(c.id);names.add(c.name);budget+=encoder.encode(JSON.stringify(c.id)).byteLength+encoder.encode(JSON.stringify(c.name)).byteLength+64;const overridden=new Set(),overrides=[];
  for(const value of dense(c.overrides,64)){const o=data(value,['name','expression']);if(typeof o.name!=='string'||!known.has(o.name)||overridden.has(o.name)||typeof o.expression!=='string'||!o.expression.trim()||o.expression.length>2048)fail('INVALID_INPUT','Invalid configuration override.');overridden.add(o.name);budget+=encoder.encode(JSON.stringify(o.name)).byteLength+encoder.encode(JSON.stringify(o.expression)).byteLength+32;if(budget>65536)fail('LIMIT','Configuration source exceeds 64 KiB.');overrides.push(Object.freeze({name:o.name,expression:o.expression}));}
  if(budget>65536)fail('LIMIT','Configuration source exceeds 64 KiB.');configs.push(Object.freeze({id:c.id,name:c.name,overrides:Object.freeze(overrides)}));
 }
 if(root.activeId!==null&&(typeof root.activeId!=='string'||!ids.has(root.activeId)))fail('INVALID_INPUT','Unknown active configuration.');
 return Object.freeze({version:2,definitions:Object.freeze(base.map(d=>Object.freeze(d))),configurations:Object.freeze(configs),activeId:root.activeId});
}
export function encodePhysicalConfigurations(input){
 const value=capturePhysicalConfigurations(input),text=PHYSICAL_CONFIGURATION_PREFIX+JSON.stringify(value);if(text.length>65536||new TextEncoder().encode(text).byteLength>65536)throw new QuantityError('LIMIT','Configuration source exceeds 64 KiB.');return text;
}

// Existing definition edits update the base only. Preserve all configuration
// intent rather than silently downgrading a loaded v2 document to v1.
export function encodeUpdatedPhysicalDefinitions(currentSource,definitions){
 const existing=currentSource?decodePhysicalSource(currentSource):null;
 if(currentSource&&!existing)throw new QuantityError('INVALID_INPUT','Legacy parameter source cannot be updated as typed definitions.');
 if(existing?.version===2)return encodePhysicalConfigurations({...existing,definitions});
 return encodePhysicalSource(definitions);
}
