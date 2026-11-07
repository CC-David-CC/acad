import {physicalBindingFields} from './physicalBindingFields.mjs';
// Structural and identity check only. Dimensional evaluation and coupled
// geometry validation occur in the pinned Worker, not on the UI thread.
export function verifyPhysicalBindings(manifest,bindings){
 if(!manifest||manifest.version!==1||!Array.isArray(manifest.targets)||manifest.targets.length>256||!bindings||bindings.version!==1||!Array.isArray(bindings.targets)||bindings.targets.length!==manifest.targets.length)throw Error('Invalid parameter binding response.');
 for(let i=0;i<manifest.targets.length;i++){
  const expected=manifest.targets[i],actual=bindings.targets[i];if(!expected||!actual||expected.kind!==actual.kind)throw Error('The parameter binding identity changed.');
  if(expected.kind==='feature'){
   if(expected.index!==actual.index||expected.featureId!==actual.featureId||expected.type!==actual.type||!expected.fields||!actual.fields||!actual.dimensions)throw Error('The parameter binding identity changed.');
   const keys=Object.keys(expected.fields).sort();if(keys.length>10||Object.keys(actual.fields).sort().join(',')!==keys.join(',')||Object.keys(actual.dimensions).sort().join(',')!==keys.join(','))throw Error('The parameter field set changed.');
   for(const key of keys)if(actual.dimensions[key]!=='length'||typeof actual.fields[key]!=='number'||!Number.isFinite(actual.fields[key]))throw Error('Invalid resolved parameter field.');
  }else if(expected.kind==='rectangle'){
   if(expected.faceId!==actual.faceId||expected.widthSegmentId!==actual.widthSegmentId||expected.heightSegmentId!==actual.heightSegmentId||actual.dimension!=='length'||![actual.width,actual.height].every(v=>typeof v==='number'&&Number.isFinite(v)))throw Error('The rectangle binding identity changed.');
  }else throw Error('Unsupported parameter binding response.');
 }
 return true;
}

// Snapshot only the small admitted shape before waiting for the Worker lock.
// This also avoids cloning an attacker-sized string from a restored document.
export function capturePhysicalManifest(input){
 const data=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(k=>typeof k!=='string'||!keys.includes(k)))throw Error('Invalid parameter binding manifest.');const out=Object.create(null);for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Invalid parameter binding manifest.');out[key]=d.value;}return out;};
 const root=data(input,['version','targets']);if(root.version!==1||!Array.isArray(root.targets)||root.targets.length>256||Reflect.ownKeys(root.targets).length!==root.targets.length+1)throw Error('Invalid parameter binding manifest.');
 const value=v=>{if(typeof v==='number'&&Number.isFinite(v))return v;if(typeof v==='string'&&v.length>0&&v.length<=128)return v;throw Error('Invalid parameter binding value.');};
 const targets=[];for(let i=0;i<root.targets.length;i++){const d=Object.getOwnPropertyDescriptor(root.targets,String(i));if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('Invalid parameter binding manifest.');const item=d.value,kind=Object.getOwnPropertyDescriptor(item||{},'kind');if(!kind?.enumerable||!Object.hasOwn(kind,'value'))throw Error('Invalid parameter binding manifest.');if(kind.value==='feature'){const t=data(item,['kind','index','featureId','type','fields']),fields=typeof t.type==='string'&&Object.hasOwn(physicalBindingFields,t.type)?physicalBindingFields[t.type]:null;if(!fields||!Number.isSafeInteger(t.index)||t.index<0||t.index>255||!Number.isSafeInteger(t.featureId)||t.featureId<1)throw Error('Invalid parameter binding identity.');const original=data(t.fields,fields),copy=Object.create(null);for(const field of fields)copy[field]=value(original[field]);targets.push(Object.freeze({kind:'feature',index:t.index,featureId:t.featureId,type:t.type,fields:Object.freeze(copy)}));}else if(kind.value==='rectangle'){const t=data(item,['kind','faceId','widthSegmentId','heightSegmentId','width','height']);if(typeof t.faceId!=='string'||!t.faceId||t.faceId.length>1024||t.widthSegmentId!=='rect-0'||t.heightSegmentId!=='rect-1')throw Error('Invalid rectangle binding identity.');targets.push(Object.freeze({kind:'rectangle',faceId:t.faceId,widthSegmentId:t.widthSegmentId,heightSegmentId:t.heightSegmentId,width:value(t.width),height:value(t.height)}));}else throw Error('Unsupported parameter binding target.');}
 return Object.freeze({version:1,targets:Object.freeze(targets)});
}
