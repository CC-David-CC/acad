// Derived, bounded computational manifest; authored history and sketch remain authoritative.
import {QuantityError} from './physicalQuantities.mjs';
import {enclosurePlan,enclosurePlanV2} from '../../../../modules/engine/mount/enclosurePlan.mjs';
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
import {physicalBindingFields as names} from './physicalBindingFields.mjs';
const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const ident=/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/;
function fail(code,message,parameter){throw new QuantityError(code,message,parameter)}
function record(input,keys){if(!input||typeof input!=='object'||Array.isArray(input)||Reflect.ownKeys(input).length!==keys.length||Reflect.ownKeys(input).some(k=>typeof k!=='string'||!keys.includes(k)))fail('INVALID_INPUT','Invalid binding fields.');const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(input,key);if(!d?.enumerable||!own(d,'value'))fail('INVALID_INPUT','Invalid binding fields.');out[key]=d.value;}return out;}
function dense(array,max){if(!Array.isArray(array)||array.length>max||Reflect.ownKeys(array).length!==array.length+1)fail('INVALID_INPUT','Bindings must be a bounded dense array.');return Array.from({length:array.length},(_,i)=>{const d=Object.getOwnPropertyDescriptor(array,String(i));if(!d?.enumerable||!own(d,'value'))fail('INVALID_INPUT','Bindings must be a bounded dense array.');return d.value;});}
export function resolvePhysicalBindings(input,quantities){
 const root=record(input,['version','targets']);if(root.version!==1)fail('UNSUPPORTED_VERSION','Unsupported binding version.');
 const q=record(quantities,['version','values']);if(q.version!==1)fail('INVALID_INPUT','Invalid evaluated quantities.');const values=new Map();for(const item of dense(q.values,256)){const row=record(item,['name','dimension','value']);if(typeof row.name!=='string'||!ident.test(row.name)||values.has(row.name)||!['scalar','length','area','volume','angle','count','boolean'].includes(row.dimension)||!(row.dimension==='boolean'?typeof row.value==='boolean':typeof row.value==='number'&&Number.isFinite(row.value)))fail('INVALID_INPUT','Invalid evaluated quantity.');values.set(row.name,row);}
 const ids=new Set(),indices=new Set(),faces=new Set(),out=[];
 function length(value,max,min=0){let resolved=value;if(typeof value==='string'){if(value.length>128)fail('LIMIT','Binding value exceeds the limit.');const text=value.trim();if(numeric.test(text))resolved=Number(text);else{if(!ident.test(text))fail('INVALID_INPUT','Only named typed bindings are supported.');const quantity=values.get(text);if(!quantity)fail('UNKNOWN_PARAMETER','Unknown parameter.',text);if(quantity.dimension!=='length')fail('DIMENSION_MISMATCH','A length parameter is required.',text);resolved=quantity.value;}}if(typeof resolved!=='number'||!Number.isFinite(resolved)||(min?resolved<min:resolved<=0)||resolved>max)fail('NUMERIC_DOMAIN','Length is outside the supported bounds.');return resolved;}
 for(const target of dense(root.targets,256)){
  const kind=Object.getOwnPropertyDescriptor(target||{},'kind');if(!kind?.enumerable||!own(kind,'value'))fail('INVALID_INPUT','Invalid binding target.');
  if(kind.value==='feature'){
   const t=record(target,['kind','index','featureId','type','fields']),list=own(names,t.type)?names[t.type]:null;if(!list)fail('UNSUPPORTED_TARGET','Unsupported feature binding.');if(!Number.isSafeInteger(t.index)||t.index<0||t.index>255||!Number.isSafeInteger(t.featureId)||t.featureId<1||ids.has(t.featureId)||indices.has(t.index))fail('INVALID_INPUT','Duplicate or invalid feature identity.');ids.add(t.featureId);indices.add(t.index);
   const original=record(t.fields,list),fields=Object.create(null),max=t.type.startsWith('WORKER_ENCLOSURE_')?100000:1000000;for(const field of list)fields[field]=length(original[field],max);
   if(t.type.startsWith('WORKER_ENCLOSURE_')){const plan={unit:'millimeter',width:fields.width,length:fields.length,height:fields.height,wall:fields.wall,clearance:fields.clearance,lidThickness:fields.lidThickness,lipDepth:fields.lipDepth};try{if(t.type==='WORKER_ENCLOSURE_V2')enclosurePlanV2({...plan,label:{width:fields.labelWidth,length:fields.labelLength,depth:fields.labelDepth}});else enclosurePlan(plan)}catch{fail('INVALID_DIMENSIONS','Enclosure dimensions are incompatible.');}}
   const dimensions=Object.freeze(Object.fromEntries(list.map(field=>[field,'length'])));out.push(Object.freeze({kind:'feature',index:t.index,featureId:t.featureId,type:t.type,fields:Object.freeze(fields),dimensions}));
  }else if(kind.value==='rectangle'){
   const t=record(target,['kind','faceId','widthSegmentId','heightSegmentId','width','height']);if(t.widthSegmentId!=='rect-0'||t.heightSegmentId!=='rect-1')fail('UNSUPPORTED_TARGET','Unsupported rectangle entity identity.');if(typeof t.faceId!=='string'||!t.faceId||t.faceId.length>1024||faces.has(t.faceId))fail('INVALID_INPUT','Duplicate or invalid sketch identity.');faces.add(t.faceId);out.push(Object.freeze({kind:'rectangle',faceId:t.faceId,widthSegmentId:t.widthSegmentId,heightSegmentId:t.heightSegmentId,dimension:'length',width:length(t.width,1000000,0.001),height:length(t.height,1000000,0.001)}));
  }else fail('UNSUPPORTED_TARGET','Unsupported binding target.');
 }
 return Object.freeze({version:1,targets:Object.freeze(out)});
}
