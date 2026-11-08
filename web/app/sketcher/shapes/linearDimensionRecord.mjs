// Canonical native LinearDimension serialization only. Structural admission is
// not live-object ownership: strict IO must resolve real registered EndPoints.
// Preserve existing nonempty-ID / finite-offset semantics, including negative
// offsets, signed zero and equal endpoint references. No new magnitude/ID cap.
function record(value,keys,label){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==keys.length)throw Error('Unsupported LinearDimension '+label+' fields.');
 const out={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d?.enumerable||!Object.hasOwn(d,'value'))throw Error('LinearDimension '+label+' fields must be own data.');out[key]=d.value;}return out;
}
function identity(value){if(typeof value!=='string'||!value)throw Error('LinearDimension identities must be nonempty native strings.');return value;}
export function captureLinearDimensionRecord(value){
 const r=record(value,['id','type','data'],'record');
 if(r.type!=='LinearDimension')throw Error('Only existing native LinearDimension records are supported here.');
 const d=record(r.data,['a','b','offset'],'data');
 if(typeof d.offset!=='number'||!Number.isFinite(d.offset))throw Error('LinearDimension offset must be finite.');
 return Object.freeze({id:identity(r.id),type:'LinearDimension',data:Object.freeze({a:identity(d.a),b:identity(d.b),offset:d.offset})});
}
